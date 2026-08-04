import sqlite3
import json
import os
import time

DB_FILE = os.path.join(os.path.dirname(__file__), "libera.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at REAL NOT NULL
        )
    ''')

    # Books Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            name TEXT NOT NULL,
            size INTEGER NOT NULL,
            pages INTEGER NOT NULL,
            upload_date TEXT NOT NULL,
            status TEXT NOT NULL,
            cover_color TEXT NOT NULL,
            filepath TEXT NOT NULL,
            created_at REAL NOT NULL
        )
    ''')

    # Chunks Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            book_name TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            vector_json TEXT,
            FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
        )
    ''')

    # Conversations Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        )
    ''')

    # Messages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp REAL NOT NULL,
            citations_json TEXT,
            books_used_json TEXT,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
        )
    ''')

    # Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            user_id TEXT PRIMARY KEY,
            theme TEXT DEFAULT 'dark',
            language TEXT DEFAULT 'en',
            embedding_model TEXT DEFAULT 'BAAI/bge-small-en-v1.5',
            chunk_size INTEGER DEFAULT 800,
            chunk_overlap INTEGER DEFAULT 150,
            llm_model TEXT DEFAULT 'llama-3.3-70b-versatile',
            vector_db TEXT DEFAULT 'ChromaDB',
            api_key TEXT DEFAULT '',
            system_prompt TEXT DEFAULT ''
        )
    ''')

    conn.commit()
    conn.close()

init_db()
