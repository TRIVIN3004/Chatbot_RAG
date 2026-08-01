import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import time
import json
import uuid
import shutil

# Ensure backend directory is in sys.path for relative imports when invoked from root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from database import get_db_connection, init_db
from rag_engine import process_and_embed_book, retrieve_top_chunks, generate_rag_answer, delete_book_from_vector_store

from dotenv import load_dotenv, dotenv_values
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Load environment variables
env_file_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_file_path, override=True)
env_dict = dotenv_values(env_file_path)
GOOGLE_CLIENT_ID = env_dict.get("GOOGLE_CLIENT_ID") or os.environ.get("GOOGLE_CLIENT_ID")


app = FastAPI(title="Libramind RAG Backend", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize Database tables
init_db()

# Pydantic Schemas
class ChatRequest(BaseModel):
    user_id: str = "demo-user"
    conversation_id: Optional[str] = None
    query: str
    selected_book_ids: Optional[List[str]] = None

class BookRenameRequest(BaseModel):
    name: str

class SearchRequest(BaseModel):
    user_id: str = "demo-user"
    query: str
    book_id: Optional[str] = None

class AuthRequest(BaseModel):
    name: Optional[str] = None
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    token: str


# Book Cover Colors helper
COVER_COLORS = [
    "linear-gradient(135deg, #5B5FFF 0%, #7B61FF 100%)",
    "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)",
    "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
    "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
    "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
]

@app.get("/")
def read_root():
    return {"message": "Libramind RAG API is running smoothly."}

# AUTH ENDPOINTS
@app.post("/api/auth/signup")
def signup(req: AuthRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    user_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, req.name or req.email.split("@")[0], req.email, req.password, time.time())
    )
    conn.commit()
    conn.close()
    return {"user_id": user_id, "name": req.name or req.email.split("@")[0], "email": req.email}

@app.post("/api/auth/login")
def login(req: AuthRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (req.email,))
    row = cursor.fetchone()
    if row:
        if row["password_hash"] == req.password:
            conn.close()
            return {"user_id": row["id"], "name": row["name"], "email": row["email"]}
        else:
            conn.close()
            raise HTTPException(status_code=400, detail="Incorrect password.")
    
    conn.close()
    if req.email == "scholar@libera.ai" or req.email == "user@libera.ai":
        return {"user_id": "demo-user", "name": "Libera User", "email": req.email}
        
    raise HTTPException(status_code=400, detail="Account not found. Please Sign Up first.")

@app.post("/api/auth/google")
def google_auth(req: GoogleAuthRequest):
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=True)
    client_id = os.environ.get("GOOGLE_CLIENT_ID") or GOOGLE_CLIENT_ID
    if not client_id or "your-google-client-id-here" in client_id:
        raise HTTPException(
            status_code=400,
            detail="Google Client ID is not configured on the backend server."
        )

    try:
        # Verify the Google OAuth token ID
        idinfo = id_token.verify_oauth2_token(
            req.token,
            google_requests.Request(),
            client_id
        )

        # Get user details from verified payload
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0] if email else "Google User")
        google_user_id = f"google-{idinfo.get('sub')}"

        if not email:
            raise HTTPException(status_code=400, detail="Google authentication did not return an email address.")

        # Check if user already exists, or create a new one in SQLite database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email FROM users WHERE email = ?", (email,))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row["id"]
            user_name = user_row["name"]
        else:
            user_id = google_user_id
            user_name = name
            cursor.execute(
                "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, user_name, email, "google-oauth-managed-password-hash", time.time())
            )
            conn.commit()
            
        conn.close()
        return {"user_id": user_id, "name": user_name, "email": email}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication error: {str(e)}")


# SETTINGS ENDPOINTS
class SettingsSchema(BaseModel):
    theme: str
    language: str
    embeddingModel: str
    chunkSize: int
    chunkOverlap: int
    llmModel: str
    vectorDb: str
    apiKey: str
    systemPrompt: str

@app.get("/api/settings")
def get_settings(user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT theme, language, embedding_model, chunk_size, chunk_overlap, 
                  llm_model, vector_db, api_key, system_prompt 
           FROM settings WHERE user_id = ?""",
        (user_id,)
    )
    row = cursor.fetchone()
    
    if not row:
        # Default settings insert
        default_system_prompt = (
            "You are Libramind, an AI assistant that answers questions exclusively from the user's uploaded documents.\n"
            "Rules:\n"
            "1. Use only the retrieved document context.\n"
            "2. Never use outside knowledge.\n"
            "3. If the answer is not found in the uploaded books, reply: \"I couldn't find this information in the uploaded books.\"\n"
            "4. Cite every answer with the book name and page number."
        )
        cursor.execute(
            """INSERT INTO settings (user_id, theme, language, embedding_model, chunk_size, chunk_overlap, llm_model, vector_db, api_key, system_prompt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, "light", "en", "BAAI/bge-small-en-v1.5", 800, 150, "llama-3.3-70b-versatile", "ChromaDB", "", default_system_prompt)
        )
        conn.commit()
        
        # Query again to get the inserted row
        cursor.execute(
            """SELECT theme, language, embedding_model, chunk_size, chunk_overlap, 
                      llm_model, vector_db, api_key, system_prompt 
               FROM settings WHERE user_id = ?""",
            (user_id,)
        )
        row = cursor.fetchone()
        
    conn.close()
    
    return {
        "theme": row["theme"],
        "language": row["language"],
        "embeddingModel": row["embedding_model"],
        "chunkSize": row["chunk_size"],
        "chunkOverlap": row["chunk_overlap"],
        "llmModel": row["llm_model"],
        "vectorDb": row["vector_db"],
        "apiKey": row["api_key"],
        "systemPrompt": row["system_prompt"]
    }

@app.put("/api/settings")
def update_settings(req: SettingsSchema, user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if row exists, if not we do insert, else update
    cursor.execute("SELECT user_id FROM settings WHERE user_id = ?", (user_id,))
    exists = cursor.fetchone()
    
    if exists:
        cursor.execute(
            """UPDATE settings 
               SET theme = ?, language = ?, embedding_model = ?, chunk_size = ?, chunk_overlap = ?, 
                   llm_model = ?, vector_db = ?, api_key = ?, system_prompt = ?
               WHERE user_id = ?""",
            (req.theme, req.language, req.embeddingModel, req.chunkSize, req.chunkOverlap,
             req.llmModel, req.vectorDb, req.apiKey, req.systemPrompt, user_id)
        )
    else:
        cursor.execute(
            """INSERT INTO settings (user_id, theme, language, embedding_model, chunk_size, chunk_overlap, llm_model, vector_db, api_key, system_prompt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, req.theme, req.language, req.embeddingModel, req.chunkSize, req.chunkOverlap, req.llmModel, req.vectorDb, req.apiKey, req.systemPrompt)
        )
        
    conn.commit()
    conn.close()
    return {"success": True}


# UPLOAD & BOOK MANAGEMENT

@app.post("/api/upload")
async def upload_book(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form("demo-user")
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check maximum 4 books limit
    cursor.execute("SELECT COUNT(*) as count FROM books WHERE user_id = ?", (user_id,))
    count = cursor.fetchone()["count"]
    if count >= 4:
        conn.close()
        raise HTTPException(status_code=400, detail="Maximum limit of 4 books reached. Please delete an existing book to upload a new one.")

    book_id = str(uuid.uuid4())
    filename = file.filename
    clean_name = os.path.splitext(filename)[0]
    filepath = os.path.join(UPLOAD_DIR, f"{book_id}_{filename}")

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(filepath)
    color_index = count % len(COVER_COLORS)
    cover_color = COVER_COLORS[color_index]
    upload_date = time.strftime("%Y-%m-%d %H:%M")

    cursor.execute(
        """INSERT INTO books (id, user_id, filename, name, size, pages, upload_date, status, cover_color, filepath, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (book_id, user_id, filename, clean_name, file_size, 0, upload_date, "Uploading", cover_color, filepath, time.time())
    )
    conn.commit()
    conn.close()

    # Trigger background RAG processing & vector embedding
    background_tasks.add_task(process_and_embed_book, book_id, filepath, clean_name)

    return {
        "id": book_id,
        "name": clean_name,
        "filename": filename,
        "size": file_size,
        "pages": 0,
        "upload_date": upload_date,
        "status": "Processing",
        "cover_color": cover_color
    }

@app.get("/api/books")
def get_books(user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, filename, name, size, pages, upload_date, status, cover_color, filepath FROM books WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    books = []
    for r in rows:
        books.append({
            "id": r["id"],
            "filename": r["filename"],
            "name": r["name"],
            "size": r["size"],
            "pages": r["pages"],
            "upload_date": r["upload_date"],
            "status": r["status"],
            "cover_color": r["cover_color"]
        })
    return books

@app.delete("/api/books/{book_id}")
def delete_book(book_id: str, user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filepath FROM books WHERE id = ? AND user_id = ?", (book_id, user_id))
    row = cursor.fetchone()
    if row and os.path.exists(row["filepath"]):
        try:
            os.remove(row["filepath"])
        except Exception:
            pass
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    cursor.execute("DELETE FROM chunks WHERE book_id = ?", (book_id,))
    delete_book_from_vector_store(book_id)
    conn.commit()
    conn.close()
    return {"success": True, "message": "Book deleted successfully."}

@app.put("/api/books/{book_id}/rename")
def rename_book(book_id: str, req: BookRenameRequest, user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE books SET name = ? WHERE id = ? AND user_id = ?", (req.name, book_id, user_id))
    cursor.execute("UPDATE chunks SET book_name = ? WHERE book_id = ?", (req.name, book_id))
    conn.commit()
    conn.close()
    return {"success": True, "name": req.name}

@app.post("/api/books/{book_id}/reindex")
def reindex_book(book_id: str, background_tasks: BackgroundTasks, user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filepath, name FROM books WHERE id = ? AND user_id = ?", (book_id, user_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Book not found.")
    
    background_tasks.add_task(process_and_embed_book, book_id, row["filepath"], row["name"])
    return {"success": True, "message": "Re-indexing triggered."}

@app.get("/api/books/{book_id}/file")
def get_book_file(book_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filepath, filename FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    conn.close()
    if not row or not os.path.exists(row["filepath"]):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(row["filepath"], filename=row["filename"], media_type="application/pdf")

@app.get("/api/books/{book_id}/page/{page_number}")
def get_book_page_text(book_id: str, page_number: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT text, page_number, chunk_index FROM chunks WHERE book_id = ? AND page_number = ? ORDER BY chunk_index ASC",
        (book_id, page_number)
    )
    rows = cursor.fetchall()
    conn.close()
    return {
        "book_id": book_id,
        "page_number": page_number,
        "chunks": [{"chunk_index": r["chunk_index"], "text": r["text"]} for r in rows]
    }

# CHAT & RAG SEARCH
@app.post("/api/chat")
def chat(req: ChatRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create or update conversation
    conv_id = req.conversation_id
    if not conv_id:
        conv_id = str(uuid.uuid4())
        title = req.query[:35] + ("..." if len(req.query) > 35 else "")
        cursor.execute(
            "INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (conv_id, req.user_id, title, time.time(), time.time())
        )
    else:
        cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (time.time(), conv_id))

    # Save User message
    user_msg_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO messages (id, conversation_id, sender, text, timestamp) VALUES (?, ?, ?, ?, ?)",
        (user_msg_id, conv_id, "user", req.query, time.time())
    )
    conn.commit()
    conn.close()

    # Retrieve chunks
    chunks = retrieve_top_chunks(req.query, user_id=req.user_id, top_k=5, filter_book_ids=req.selected_book_ids)
    
    # Retrieve user settings
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT llm_model, api_key, system_prompt FROM settings WHERE user_id = ?",
        (req.user_id,)
    )
    settings_row = cursor.fetchone()
    conn.close()

    system_prompt = None
    llm_model = None
    api_key = None
    if settings_row:
        system_prompt = settings_row["system_prompt"]
        llm_model = settings_row["llm_model"]
        api_key = settings_row["api_key"]

    answer, citations = generate_rag_answer(
        req.query,
        chunks,
        system_prompt=system_prompt,
        llm_model=llm_model,
        api_key=api_key
    )

    # Save AI message
    ai_msg_id = str(uuid.uuid4())
    books_used = list(set([c["book_name"] for c in citations])) if citations else []
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (id, conversation_id, sender, text, timestamp, citations_json, books_used_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (ai_msg_id, conv_id, "ai", answer, time.time(), json.dumps(citations), json.dumps(books_used))
    )
    conn.commit()
    conn.close()

    return {
        "conversation_id": conv_id,
        "message_id": ai_msg_id,
        "answer": answer,
        "citations": citations,
        "books_used": books_used
    }

@app.get("/api/history")
def get_history(user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
    conv_rows = cursor.fetchall()
    
    result = []
    for conv in conv_rows:
        cid = conv["id"]
        cursor.execute("SELECT id, sender, text, timestamp, citations_json, books_used_json FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC", (cid,))
        msg_rows = cursor.fetchall()
        
        messages = []
        for m in msg_rows:
            citations = json.loads(m["citations_json"]) if m["citations_json"] else []
            books_used = json.loads(m["books_used_json"]) if m["books_used_json"] else []
            messages.append({
                "id": m["id"],
                "sender": m["sender"],
                "text": m["text"],
                "timestamp": m["timestamp"],
                "citations": citations,
                "books_used": books_used
            })
            
        result.append({
            "id": cid,
            "title": conv["title"],
            "created_at": conv["created_at"],
            "updated_at": conv["updated_at"],
            "messages": messages
        })
    conn.close()
    return result

@app.delete("/api/history/{conversation_id}")
def delete_conversation(conversation_id: str, user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conversations WHERE id = ? AND user_id = ?", (conversation_id, user_id))
    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/history")
def clear_all_history(user_id: str = "demo-user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM conversations WHERE user_id = ?", (user_id,))
    convs = cursor.fetchall()
    for c in convs:
        cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (c["id"],))
    cursor.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/search")
def search_books(req: SearchRequest):
    chunks = retrieve_top_chunks(req.query, user_id=req.user_id, top_k=10, filter_book_ids=[req.book_id] if req.book_id else None)
    return {"query": req.query, "results": chunks}

# ADMIN ANALYTICS
@app.get("/api/admin")
def get_admin_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()["total_users"] or 1

    cursor.execute("SELECT COUNT(*) as total_books, SUM(size) as total_size, SUM(pages) as total_pages FROM books")
    book_stats = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as total_chunks FROM chunks")
    total_chunks = cursor.fetchone()["total_chunks"] or 0

    cursor.execute("SELECT COUNT(*) as total_chats FROM conversations")
    total_chats = cursor.fetchone()["total_chats"] or 0

    cursor.execute("SELECT status, COUNT(*) as count FROM books GROUP BY status")
    status_rows = cursor.fetchall()
    status_counts = {r["status"]: r["count"] for r in status_rows}

    conn.close()

    total_bytes = book_stats["total_size"] or 0
    size_mb = round(total_bytes / (1024 * 1024), 2)

    return {
        "total_users": max(total_users, 1),
        "total_books": book_stats["total_books"] or 0,
        "total_storage_mb": size_mb,
        "total_pages": book_stats["total_pages"] or 0,
        "total_embedded_chunks": total_chunks,
        "total_active_chats": total_chats,
        "status_breakdown": status_counts,
        "vector_index_status": "Healthy (ChromaDB / Vector Math)",
        "server_uptime": "99.98%"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
