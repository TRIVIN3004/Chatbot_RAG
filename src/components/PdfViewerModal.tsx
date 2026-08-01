import React, { useState } from 'react';
import { 
  X, ChevronLeft, ChevronRight, BookOpen, Search, 
  Download, ZoomIn, ZoomOut, FileText, Layers
} from 'lucide-react';
import type { Book } from '../types';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  initialPage?: number;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  book,
  initialPage = 1
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !book) return null;

  const totalPages = book.pages || 100;

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    }
    return 'http://localhost:8000';
  };

  const isUploadedBook = !book.id.startsWith('book-');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[90vh] rounded-2xl glass-panel border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-10 rounded flex items-center justify-center text-white font-mono text-[10px] font-bold shadow"
              style={{ background: book.cover_color }}
            >
              PDF
            </div>
            <div>
              <h3 className="text-sm font-bold text-white max-w-md truncate">{book.name}</h3>
              <span className="text-[11px] text-slate-400">{book.filename} • {book.pages > 0 ? `${book.pages} Pages` : 'Ready'}</span>
            </div>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-mono">
              Page <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(totalPages, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-12 bg-slate-800 border border-slate-700 text-center text-white rounded px-1 text-xs outline-none"
              /> {totalPages > 0 ? `of ${totalPages}` : ''}
            </span>
            <button
              onClick={handleNext}
              disabled={totalPages > 0 && currentPage >= totalPages}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isUploadedBook && (
              <a
                href={`${getApiBaseUrl()}/api/books/${book.id}/file`}
                target="_blank"
                rel="noreferrer"
                download={book.filename}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Page Document View Area */}
        <div className="flex-1 overflow-hidden bg-slate-950 p-3 flex justify-center items-center">
          {isUploadedBook ? (
            <iframe
              src={`${getApiBaseUrl()}/api/books/${book.id}/file#page=${currentPage}`}
              className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
              title={book.name}
            />
          ) : (
            <div
              className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 max-w-3xl w-full min-h-[550px] text-slate-200 font-serif leading-relaxed transition-transform duration-200 relative"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-wider">
                <span>{book.name}</span>
                <span>SAMPLE PREVIEW • PAGE {currentPage}</span>
              </div>
              <div className="space-y-4 text-sm text-slate-300 font-sans">
                <h2 className="text-xl font-bold text-white">{book.name}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This is a sample demonstration card. Upload your actual PDF textbook to view real PDF pages, page citations, and document text previews.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
