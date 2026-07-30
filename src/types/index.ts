export type BookStatus = 'Uploading' | 'Processing' | 'Embedding' | 'Ready';

export interface Book {
  id: string;
  name: string;
  filename: string;
  size: number;
  pages: number;
  upload_date: string;
  status: BookStatus;
  cover_color: string;
}

export interface Citation {
  book_id: string;
  book_name: string;
  page: number;
  chunk: number;
  snippet: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  citations?: Citation[];
  books_used?: string[];
  isThinking?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  messages: Message[];
}

export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  llmModel: string;
  vectorDb: string;
  apiKey: string;
  systemPrompt: string;
}

export interface AdminStats {
  total_users: number;
  total_books: number;
  total_storage_mb: number;
  total_pages: number;
  total_embedded_chunks: number;
  total_active_chats: number;
  status_breakdown: Record<string, number>;
  vector_index_status: string;
  server_uptime: string;
}
