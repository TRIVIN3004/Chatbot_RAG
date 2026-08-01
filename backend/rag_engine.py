import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import re
import json
import math
import uuid
import time
from typing import List, Dict, Any, Tuple

# Ensure backend directory is in sys.path for relative imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

from database import get_db_connection
import chromadb

# Initialize ChromaDB persistent client
CHROMA_DATA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
# Use cosine similarity space for matching vectors
collection = chroma_client.get_or_create_collection(
    name="libera_chunks",
    metadata={"hnsw:space": "cosine"}
)


DEFAULT_SYSTEM_PROMPT = """You are Libramind, an AI assistant that answers questions exclusively from the user's uploaded documents.

Rules:
1. Use only the retrieved document context.
2. Never use outside knowledge.
3. If the answer is not found in the uploaded books, reply:
   "I couldn't find this information in the uploaded books."
4. Cite every answer with the book name and page number.
5. If multiple books contain relevant information, combine them and cite each source.
6. Be concise, accurate, and factual.
7. Preserve technical terminology from the source material where appropriate."""

class SimpleEmbedder:
    """Lightweight & fast vector embedding engine based on n-gram TF-IDF & Cosine Similarity."""
    @staticmethod
    def tokenize(text: str) -> List[str]:
        words = re.findall(r'\w+', text.lower())
        tokens = []
        for w in words:
            tokens.append(w)
            if len(w) > 4:
                tokens.append(w[:4])
        return tokens

    @staticmethod
    def get_vector(text: str) -> Dict[str, float]:
        tokens = SimpleEmbedder.tokenize(text)
        if not tokens:
            return {}
        counts = {}
        for t in tokens:
            counts[t] = counts.get(t, 0) + 1.0
        # Normalize L2
        norm = math.sqrt(sum(v * v for v in counts.values()))
        if norm == 0:
            return counts
        return {k: v / norm for k, v in counts.items()}

    @staticmethod
    def cosine_similarity(v1: Dict[str, float], v2: Dict[str, float]) -> float:
        if not v1 or not v2:
            return 0.0
        # Iterate over smaller dict
        if len(v1) > len(v2):
            v1, v2 = v2, v1
        dot = sum(val * v2.get(key, 0.0) for key, val in v1.items())
        return dot

def extract_text_from_pdf(filepath: str) -> List[Dict[str, Any]]:
    """
    Extracts text per page from a PDF file.
    Returns list of dicts: [{'page': 1, 'text': '...'}, ...]
    """
    pages_data = []
    if HAS_PYPDF:
        try:
            reader = PdfReader(filepath)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages_data.append({
                    "page": idx + 1,
                    "text": text.strip()
                })
            if pages_data:
                return pages_data
        except Exception:
            pass

    # Fallback for plain text, docx, or raw PDF text extraction
    with open(filepath, "rb") as f:
        raw = f.read()

    # Extract printable text strings
    text_matches = re.findall(rb'[A-Za-z0-9\s.,;:!\?\'"()\-\+=]{4,}', raw)
    full_text = " ".join([m.decode('ascii', errors='ignore') for m in text_matches if len(m) > 10])

    if not full_text.strip():
        full_text = f"Extracted document text content from {os.path.basename(filepath)}"

    char_per_page = 1500
    total_pages = math.ceil(len(full_text) / char_per_page) or 1
    for p in range(total_pages):
        p_text = full_text[p*char_per_page : (p+1)*char_per_page]
        pages_data.append({
            "page": p + 1,
            "text": p_text.strip()
        })
    return pages_data

def chunk_pages(pages_data: List[Dict[str, Any]], chunk_size: int = 800, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Splits text into chunks of specified character size with overlap, preserving page references.
    """
    chunks = []
    chunk_counter = 1

    for page_info in pages_data:
        page_num = page_info["page"]
        text = page_info["text"]
        
        if not text:
            continue

        if len(text) <= chunk_size:
            chunks.append({
                "chunk_index": chunk_counter,
                "page_number": page_num,
                "text": text
            })
            chunk_counter += 1
            continue

        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            chunks.append({
                "chunk_index": chunk_counter,
                "page_number": page_num,
                "text": chunk_text
            })
            chunk_counter += 1
            start += (chunk_size - chunk_overlap)
            
    return chunks

def delete_book_from_vector_store(book_id: str):
    """
    Deletes all chunks associated with a book_id from ChromaDB.
    """
    try:
        collection.delete(where={"book_id": book_id})
    except Exception as e:
        print(f"Error deleting book {book_id} from ChromaDB: {e}")

def process_and_embed_book(book_id: str, filepath: str, book_name: str, chunk_size: int = 800, chunk_overlap: int = 150):
    """
    Parses PDF, chunks text, generates embeddings, and saves chunks to SQLite DB and ChromaDB.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Update status to Processing
        cursor.execute("UPDATE books SET status = 'Processing' WHERE id = ?", (book_id,))
        conn.commit()

        pages = extract_text_from_pdf(filepath)
        page_count = len(pages)

        # Update status to Embedding & update page count
        cursor.execute("UPDATE books SET pages = ?, status = 'Embedding' WHERE id = ?", (page_count, book_id))
        conn.commit()

        chunks = chunk_pages(pages, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        # Delete any previous chunks for this book from SQLite and ChromaDB
        cursor.execute("DELETE FROM chunks WHERE book_id = ?", (book_id,))
        delete_book_from_vector_store(book_id)

        ids = []
        documents = []
        metadatas = []

        for c in chunks:
            chunk_id = f"{book_id}_chunk_{c['chunk_index']}"
            cursor.execute(
                "INSERT INTO chunks (id, book_id, book_name, page_number, chunk_index, text, vector_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (chunk_id, book_id, book_name, c["page_number"], c["chunk_index"], c["text"], None)
            )
            ids.append(chunk_id)
            documents.append(c["text"])
            metadatas.append({
                "book_id": book_id,
                "page_number": c["page_number"],
                "chunk_index": c["chunk_index"]
            })

        if ids:
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )

        # Mark as Ready
        cursor.execute("UPDATE books SET status = 'Ready' WHERE id = ?", (book_id,))
        conn.commit()
        print(f"Successfully processed and embedded book '{book_name}' ({book_id}) with {len(chunks)} chunks across {page_count} pages.")
    except Exception as e:
        print(f"Error processing book '{book_name}' ({book_id}): {e}")
        import traceback
        traceback.print_exc()
        try:
            cursor.execute("UPDATE books SET status = 'Error' WHERE id = ?", (book_id,))
            conn.commit()
        except Exception:
            pass
    finally:
        conn.close()

def retrieve_top_chunks(query: str, user_id: str, top_k: int = 5, filter_book_ids: List[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieves top_k relevant chunks from vector store using ChromaDB cosine similarity + keyword matching.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch user's books that are Ready (or fallback to books with existing chunks)
    if filter_book_ids:
        placeholders = ','.join(['?'] * len(filter_book_ids))
        cursor.execute(f"SELECT id, name FROM books WHERE user_id = ? AND id IN ({placeholders}) AND status != 'Error'", [user_id] + filter_book_ids)
    else:
        cursor.execute("SELECT id, name FROM books WHERE user_id = ? AND status != 'Error'", (user_id,))
    
    books_rows = cursor.fetchall()
    conn.close()

    if not books_rows:
        return []

    book_id_to_name = {row["id"]: row["name"] for row in books_rows}
    user_book_ids = list(book_id_to_name.keys())

    # Build query filter metadata for ChromaDB
    if len(user_book_ids) == 1:
        where_clause = {"book_id": user_book_ids[0]}
    else:
        where_clause = {"book_id": {"$in": user_book_ids}}

    try:
        # Fetch slightly more to filter/format and apply keyword boost ranking
        results = collection.query(
            query_texts=[query],
            n_results=min(top_k * 2, 20),
            where=where_clause
        )
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")
        return []

    if not results or not results["ids"] or not results["ids"][0]:
        return []

    ids = results["ids"][0]
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    retrieved = []
    query_lower = query.lower()
    keywords = [w for w in re.findall(r'\w+', query_lower) if len(w) > 2]

    for idx in range(len(ids)):
        chunk_id = ids[idx]
        text = documents[idx]
        meta = metadatas[idx]
        # In cosine space, ChromaDB distance is 1.0 - cosine_similarity
        similarity = 1.0 - distances[idx] if distances[idx] is not None else 0.0
        
        # Keyword match boost
        keyword_hits = sum(1 for kw in keywords if kw in text.lower())
        keyword_score = keyword_hits / (len(keywords) or 1)

        combined_score = 0.7 * similarity + 0.3 * keyword_score

        book_id = meta["book_id"]
        book_name = book_id_to_name.get(book_id, "Unknown Book")

        retrieved.append({
            "chunk_id": chunk_id,
            "book_id": book_id,
            "book_name": book_name,
            "page_number": meta["page_number"],
            "chunk_index": meta["chunk_index"],
            "text": text,
            "score": combined_score
        })

    retrieved.sort(key=lambda x: x["score"], reverse=True)
    return retrieved[:top_k]


def generate_rag_answer(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    system_prompt: str = None,
    llm_model: str = None,
    api_key: str = None
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Generates a grounded response based on retrieved document context using Groq.
    Returns (answer_markdown, citations_list).
    """
    if not retrieved_chunks:
        return ("I couldn't find this information in the uploaded books.", [])

    # Use retrieved chunks, prioritizing high relevance chunks
    relevant_chunks = [c for c in retrieved_chunks if c["score"] >= 0.05]
    if not relevant_chunks:
        relevant_chunks = retrieved_chunks

    citations = []
    seen_sources = set()

    for c in relevant_chunks:
        source_key = f"{c['book_name']}-P{c['page_number']}"
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            citations.append({
                "book_id": c["book_id"],
                "book_name": c["book_name"],
                "page": c["page_number"],
                "chunk": c["chunk_index"],
                "snippet": c["text"][:160] + "..." if len(c["text"]) > 160 else c["text"]
            })

    # Prepare standard excerpt fallback text in case API key is missing or call fails
    matched_excerpts = []
    for c in relevant_chunks:
        matched_excerpts.append(f"• **From {c['book_name']} (Page {c['page_number']})**:\n  > {c['text'].strip()}")
    excerpt_fallback_md = "Based on the retrieved context from your uploaded books:\n\n" + "\n\n".join(matched_excerpts)

    # Check for API Key (settings first, then backend .env environment variables)
    effective_api_key = (api_key or "").strip()
    if not effective_api_key:
        effective_api_key = (os.environ.get("GROQ_API_KEY") or "").strip()

    if not effective_api_key:
        warning_msg = (
            "⚠️ **Groq API Key is not configured.**\n\n"
            "Please configure your Groq API key in the System Settings panel (using the gear icon in the sidebar) "
            "or set the `GROQ_API_KEY` variable in the backend `.env` file to activate Groq AI-generated answers.\n\n"
            "Here is the retrieved context from your books:\n\n"
        )
        return (warning_msg + excerpt_fallback_md, citations)

    # Format the retrieved context for the LLM
    context_str = ""
    for idx, c in enumerate(relevant_chunks):
        context_str += f"--- CONTEXT CHUNK {idx+1} (Source: {c['book_name']}, Page: {c['page_number']}) ---\n{c['text']}\n\n"

    # Map/Clean model name
    model = (llm_model or "").strip()
    if not model or model in ["GPT-4.1 / GPT-5 Compatible", "Local Llama 3.1 8B"]:
        model = "llama-3.3-70b-versatile"

    # Call Groq API using HTTP requests
    import requests
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {effective_api_key}"
    }

    sys_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
    user_prompt = (
        f"Retrieved Document Context:\n"
        f"======================\n"
        f"{context_str}\n"
        f"======================\n\n"
        f"User Query / Topic: {query}\n\n"
        f"Instruction: Based on the retrieved document context above, provide a clear, informative, and detailed answer or explanation about '{query}'. "
        f"Synthesize the relevant information from the excerpts above, citing the book title and page number for each point."
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1024
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=25)
        if response.status_code == 200:
            res_data = response.json()
            answer_text = res_data["choices"][0]["message"]["content"]
            return (answer_text, citations)
        else:
            print(f"Groq API returned error status {response.status_code}: {response.text}")
            error_warning = (
                f"⚠️ **Groq API returned an error ({response.status_code}).**\n\n"
                f"Response: `{response.text[:200]}`\n\n"
                f"Falling back to matching document context:\n\n"
            )
            return (error_warning + excerpt_fallback_md, citations)
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        error_warning = (
            f"⚠️ **Failed to connect to Groq API.**\n\n"
            f"Details: `{str(e)}`\n\n"
            f"Falling back to matching document context:\n\n"
        )
        return (error_warning + excerpt_fallback_md, citations)
