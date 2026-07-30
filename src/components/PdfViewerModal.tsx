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
              <span className="text-[11px] text-slate-400">{book.filename} • {book.pages} Pages</span>
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
              /> of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search inside book & Zoom controls */}
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find in page..."
                className="pl-8 pr-3 py-1.5 rounded-lg glass-input text-xs text-white placeholder-slate-500 w-36"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Page Document View Simulation Area */}
        <div className="flex-1 overflow-auto bg-slate-950 p-8 flex justify-center items-start">
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 max-w-3xl w-full min-h-[700px] text-slate-200 font-serif leading-relaxed transition-transform duration-200 relative"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {/* Header page marker */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-wider">
              <span>{book.name}</span>
              <span>SECTION 4.2 • PAGE {currentPage}</span>
            </div>

            {/* Page Content Excerpt simulation */}
            <div className="space-y-4 text-sm text-slate-300">
              <h2 className="text-xl font-bold font-sans text-white">Chapter {Math.ceil(currentPage / 15)}: Core Architectural Principles</h2>

              <p>
                In virtual memory systems, operating systems maintain a strict mapping between virtual memory addresses used by running applications and physical addresses in hardware memory modules (RAM).
              </p>

              <div className="p-4 rounded-xl bg-[#5B5FFF]/10 border border-[#5B5FFF]/30 text-slate-200 font-sans text-xs">
                <span className="text-[#38BDF8] font-bold block mb-1">Vector Chunk Preview (Page {currentPage}, Chunk #{(currentPage % 5) + 1}):</span>
                "Each page table entry stores the frame address, valid/invalid bits, dirty bit, and access permission privileges. Page translation is accelerated using Hardware Translation Lookaside Buffers (TLB)."
              </div>

              <p>
                When a program attempts to read or write to a memory address that is not mapped in physical RAM, the processor raises a <strong>Page Fault Exception</strong>. The kernel traps this exception, identifies an available physical frame, reads the page from disk storage into RAM, and updates the Page Table Entry accordingly.
              </p>

              <p className="text-slate-400 text-xs italic mt-8 border-t border-slate-800 pt-4">
                Ref: Libera RAG Document Index • Extracted via PyMuPDF Parser • Grounded Vector Chunk #{currentPage * 4 - 3}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
