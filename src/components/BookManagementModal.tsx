import React, { useState } from 'react';
import { 
  X, UploadCloud, FileText, Trash2, Edit2, RefreshCw, 
  Check, BookMarked, Eye, AlertCircle, Sparkles, Layers
} from 'lucide-react';
import type { Book } from '../types';

interface BookManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteBook: (id: string) => void;
  onRenameBook: (id: string, newName: string) => void;
  onPreviewBook: (book: Book) => void;
}

export const BookManagementModal: React.FC<BookManagementModalProps> = ({
  isOpen,
  onClose,
  books,
  onUploadFile,
  onDeleteBook,
  onRenameBook,
  onPreviewBook
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(pdf|docx|txt)$/i)) {
      setErrorMsg('Only PDF, DOCX, and TXT files are supported.');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);
    try {
      await onUploadFile(file);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to upload book.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveRename = (id: string) => {
    if (newName.trim()) {
      onRenameBook(id, newName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center shadow-glow">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Book Management</h2>
            <p className="text-xs text-slate-400">Upload unlimited PDF books for RAG vector embedding</p>
          </div>
        </div>

        {/* Counter Info Banner */}
        <div className="mb-6 p-4 rounded-xl glass-panel border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Storage Status: {books.length} {books.length === 1 ? 'Book' : 'Books'} Uploaded</span>
          </div>
          <span className="text-xs font-semibold text-[#38BDF8] px-2.5 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20">
            Unlimited Uploads
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileChange(e.dataTransfer.files);
          }}
          className={`mb-6 p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${isDragging ? 'border-[#5B5FFF] bg-[#5B5FFF]/10' : 'border-slate-700 hover:border-[#5B5FFF]/50 bg-slate-900/40'}`}
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#5B5FFF]/20 border border-[#5B5FFF]/40 flex items-center justify-center text-[#38BDF8] mb-2 shadow-glow">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-white">Click or Drag & Drop PDF Book</span>
            <span className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT (800-char vector chunking)</span>
          </label>
        </div>

        {/* Book List Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {books.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No books uploaded yet. Upload a PDF book to get started!
            </div>
          ) : (
            books.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl glass-panel border border-slate-800 flex items-center justify-between gap-4 hover:border-[#5B5FFF]/40 transition-all"
              >
                {/* Book Thumbnail Cover */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-14 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0 font-mono text-xs font-bold"
                    style={{ background: b.cover_color }}
                  >
                    PDF
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === b.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs text-white px-2 py-1 rounded w-full outline-none"
                        />
                        <button
                          onClick={() => handleSaveRename(b.id)}
                          className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="text-sm font-bold text-white truncate">{b.name}</h4>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{(b.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{b.pages} Pages</span>
                      <span>•</span>
                      <span>{b.upload_date}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${b.status === 'Ready' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'}`}>
                    {b.status}
                  </span>

                  <button
                    onClick={() => onPreviewBook(b)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Preview PDF"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setEditingId(b.id); setNewName(b.name); }}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Rename Book"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteBook(b.id)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete Book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
