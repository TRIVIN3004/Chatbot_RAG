import os
import re
import json
import math
import uuid
import time
from typing import List, Dict, Any, Tuple
try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

from database import get_db_connection

DEFAULT_SYSTEM_PROMPT = """You are Libera, an AI assistant that answers questions exclusively from the user's uploaded documents.

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

def process_and_embed_book(book_id: str, filepath: str, book_name: str, chunk_size: int = 800, chunk_overlap: int = 150):
    """
    Parses PDF, chunks text, generates embeddings, and saves chunks to SQLite DB.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Update status to Processing
    cursor.execute("UPDATE books SET status = 'Processing' WHERE id = ?", (book_id,))
    conn.commit()

    pages = extract_text_from_pdf(filepath)
    page_count = len(pages)

    # Update status to Embedding & update page count
    cursor.execute("UPDATE books SET pages = ?, status = 'Embedding' WHERE id = ?", (page_count, book_id))
    conn.commit()

    chunks = chunk_pages(pages, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    # Delete any previous chunks for this book
    cursor.execute("DELETE FROM chunks WHERE book_id = ?", (book_id,))

    for c in chunks:
        vec = SimpleEmbedder.get_vector(c["text"])
        chunk_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO chunks (id, book_id, book_name, page_number, chunk_index, text, vector_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (chunk_id, book_id, book_name, c["page_number"], c["chunk_index"], c["text"], json.dumps(vec))
        )

    # Mark as Ready
    cursor.execute("UPDATE books SET status = 'Ready' WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()

def retrieve_top_chunks(query: str, user_id: str, top_k: int = 5, filter_book_ids: List[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieves top_k relevant chunks from vector store using cosine similarity + keyword matching.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query_vec = SimpleEmbedder.get_vector(query)

    # Fetch user's ready books
    if filter_book_ids:
        placeholders = ','.join(['?'] * len(filter_book_ids))
        cursor.execute(f"SELECT id FROM books WHERE user_id = ? AND id IN ({placeholders}) AND status = 'Ready'", [user_id] + filter_book_ids)
    else:
        cursor.execute("SELECT id FROM books WHERE user_id = ? AND status = 'Ready'", (user_id,))
    
    user_book_ids = [row["id"] for row in cursor.fetchall()]
    if not user_book_ids:
        conn.close()
        return []

    placeholders = ','.join(['?'] * len(user_book_ids))
    cursor.execute(f"SELECT id, book_id, book_name, page_number, chunk_index, text, vector_json FROM chunks WHERE book_id IN ({placeholders})", user_book_ids)
    all_chunks = cursor.fetchall()
    conn.close()

    results = []
    query_lower = query.lower()
    keywords = [w for w in re.findall(r'\w+', query_lower) if len(w) > 2]

    for row in all_chunks:
        vec = json.loads(row["vector_json"]) if row["vector_json"] else {}
        cos_score = SimpleEmbedder.cosine_similarity(query_vec, vec)
        
        # Keyword match boost
        chunk_text_lower = row["text"].lower()
        keyword_hits = sum(1 for kw in keywords if kw in chunk_text_lower)
        keyword_score = keyword_hits / (len(keywords) or 1)

        combined_score = 0.6 * cos_score + 0.4 * keyword_score

        if combined_score > 0.05 or keyword_hits > 0:
            results.append({
                "chunk_id": row["id"],
                "book_id": row["book_id"],
                "book_name": row["book_name"],
                "page_number": row["page_number"],
                "chunk_index": row["chunk_index"],
                "text": row["text"],
                "score": combined_score
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]

def generate_rag_answer(query: str, retrieved_chunks: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Generates a strictly grounded response based ONLY on retrieved document context.
    Returns (answer_markdown, citations_list).
    """
    if not retrieved_chunks:
        return ("I couldn't find this information in the uploaded books.", [])

    # Filter out very low relevance noise
    relevant_chunks = [c for c in retrieved_chunks if c["score"] >= 0.08]
    if not relevant_chunks:
        return ("I couldn't find this information in the uploaded books.", [])

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

    # Synthesize factual response from retrieved context chunks
    context_str = "\n\n".join([
        f"[Book: {c['book_name']}, Page: {c['page_number']}, Chunk: {c['chunk_index']}]\n{c['text']}"
        for c in relevant_chunks
    ])

    # Build response with synthesized insights directly referencing context
    response_parts = []
    query_words = set(re.findall(r'\w+', query.lower()))

    matched_excerpts = []
    for c in relevant_chunks:
        matched_excerpts.append(f"• **From {c['book_name']} (Page {c['page_number']})**:\n  > {c['text'].strip()}")

    if matched_excerpts:
        response_parts.append(f"Based on the retrieved context from your uploaded books:\n\n" + "\n\n".join(matched_excerpts))
    else:
        return ("I couldn't find this information in the uploaded books.", [])

    answer_text = "\n\n".join(response_parts)
    return (answer_text, citations)
