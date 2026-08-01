import React, { useState } from 'react';
import { 
  X, ChevronLeft, ChevronRight, BookOpen, Search, 
  Download, ZoomIn, ZoomOut, FileText, Layers
} from 'lucide-react';
import { Book } from '../types';

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
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    }
    return 'http://localhost:8000';
  };

  const pdfFileUrl = `${getApiBaseUrl()}/api/books/${book.id}/file#page=${currentPage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[96vh] sm:h-[90vh] rounded-xl sm:rounded-2xl glass-panel border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Control Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-4 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-4">
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

        {/* PDF Viewport */}
        <div className="flex-1 overflow-hidden bg-slate-950 p-1 sm:p-3 flex justify-center items-center">
          <iframe
            src={pdfFileUrl}
            className="w-full h-full rounded-lg sm:rounded-xl border border-slate-800 bg-white shadow-2xl"
            title={book.name}
          />
        </div>
      </div>
    </div>
  );
};
