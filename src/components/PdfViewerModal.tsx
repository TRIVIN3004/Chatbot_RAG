import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, BookOpen, Download, FileText
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
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [pageChunks, setPageChunks] = useState<string[]>([]);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage, book?.id]);

  const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    }
    return 'http://localhost:8000';
  };

  // Fetch extracted page text dynamically when page changes
  useEffect(() => {
    if (!book || !isOpen) return;

    setIsLoadingText(true);
    fetch(`${getApiBaseUrl()}/api/books/${book.id}/page/${currentPage}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.chunks)) {
          setPageChunks(data.chunks.map((c: any) => c.text));
        } else {
          setPageChunks([]);
        }
      })
      .catch(() => setPageChunks([]))
      .finally(() => setIsLoadingText(false));
  }, [book, currentPage, isOpen]);

  if (!isOpen || !book) return null;

  const totalPages = book.pages || 100;

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const pdfFileUrl = `${getApiBaseUrl()}/api/books/${book.id}/file#page=${currentPage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[96vh] sm:h-[90vh] rounded-xl sm:rounded-2xl glass-panel border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Control Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-4 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className="w-7 h-9 sm:w-8 sm:h-10 rounded flex items-center justify-center text-white font-mono text-[9px] sm:text-[10px] font-bold shadow flex-shrink-0"
              style={{ background: book.cover_color }}
            >
              PDF
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-white max-w-[150px] sm:max-w-md truncate">{book.name}</h3>
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block">
                {book.pages > 0 ? `${book.pages} Pages` : 'Ready'}
              </span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium ${
                activeTab === 'pdf' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>PDF Viewer</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium ${
                activeTab === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted Text</span>
            </button>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800 text-[11px] sm:text-xs flex-shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className="p-0.5 sm:p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-white font-mono text-[11px] sm:text-xs">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(totalPages, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-8 sm:w-12 bg-slate-800 border border-slate-700 text-center text-white rounded px-0.5 sm:px-1 text-[11px] sm:text-xs outline-none"
              /> {totalPages > 0 ? `/ ${totalPages}` : ''}
            </span>
            <button
              onClick={handleNext}
              disabled={totalPages > 0 && currentPage >= totalPages}
              className="p-0.5 sm:p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <a
              href={`${getApiBaseUrl()}/api/books/${book.id}/file`}
              target="_blank"
              rel="noreferrer"
              download={book.filename}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Open / Download PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-hidden bg-slate-950 p-2 sm:p-4 flex justify-center items-center">
          {activeTab === 'pdf' ? (
            <iframe
              src={pdfFileUrl}
              className="w-full h-full rounded-lg sm:rounded-xl border border-slate-800 bg-white shadow-2xl"
              title={book.name}
            />
          ) : (
            <div className="w-full h-full overflow-y-auto rounded-lg sm:rounded-xl border border-slate-800 bg-slate-900/90 p-4 sm:p-8 text-slate-200">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-semibold text-indigo-400">Page {currentPage} Content Excerpts</h4>
                  <span className="text-xs text-slate-500">{pageChunks.length} chunk(s) indexed</span>
                </div>
                
                {isLoadingText ? (
                  <div className="py-12 text-center text-slate-500 text-sm animate-pulse">Loading page text...</div>
                ) : pageChunks.length > 0 ? (
                  pageChunks.map((chunkText, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-300">
                      {chunkText}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    No extracted text chunks found for Page {currentPage}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
