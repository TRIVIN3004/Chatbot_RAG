import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User as UserIcon, Sparkles, Copy, Check, 
  RotateCcw, Square, Download, BookOpen, ExternalLink, 
  FileText, ShieldCheck, Layers, HelpCircle
} from 'lucide-react';
import { Message, Citation, Book } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (query: string) => void;
  isGenerating: boolean;
  onStopGenerating: () => void;
  onRegenerate: () => void;
  onOpenCitation: (bookName: string, page: number) => void;
  books: Book[];
  onOpenUpload: () => void;
  onExportChat: (format: 'markdown' | 'txt' | 'json') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  onStopGenerating,
  onRegenerate,
  onOpenCitation,
  books,
  onOpenUpload,
  onExportChat
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isGenerating) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    "Summarize the main concepts across all uploaded books.",
    "What is the definition of page tables and virtual memory?",
    "Compare network protocol layers and packet encapsulation.",
    "Explain key algorithms and their time complexity."
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F172A] relative overflow-hidden">
      {/* Export & Actions Top Sub-header */}
      {messages.length > 0 && (
        <div className="px-6 py-2 bg-[#0B1120]/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Strict Document Grounding Active</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Export Conversation:</span>
            <button
              onClick={() => onExportChat('markdown')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
            >
              .MD
            </button>
            <button
              onClick={() => onExportChat('txt')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-[#38BDF8] font-mono text-[10px]"
            >
              .TXT
            </button>
          </div>
        </div>
      )}

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center shadow-glow mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Libera RAG Intelligence</h2>
            <p className="text-sm text-slate-400 max-w-md mb-8">
              Ask any question about your {books.length} uploaded books. Answers are generated exclusively from document context with zero outside hallucinations.
            </p>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(qp)}
                  className="p-4 rounded-xl glass-panel-interactive border border-slate-800 text-xs text-slate-300 hover:text-white flex items-start gap-3"
                >
                  <HelpCircle className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                  <span>{qp}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center text-white flex-shrink-0 shadow-glow">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-2xl w-full rounded-2xl p-5 ${msg.sender === 'user' ? 'bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] text-white shadow-glow' : 'glass-panel border border-slate-800 text-slate-200'}`}>
                {/* Header info */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <span className="text-xs font-bold tracking-wide">
                    {msg.sender === 'user' ? 'You' : 'Libera AI'}
                  </span>
                  <span className="text-[10px] opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body Content */}
                <div className="text-sm leading-relaxed font-sans">
                  {msg.sender === 'ai' ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                </div>

                {/* Source Citations Section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60">
                    <div className="text-xs font-bold text-[#38BDF8] flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3.5 h-3.5" /> Sources & References:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((cit, cIdx) => (
                        <div
                          key={cIdx}
                          onClick={() => onOpenCitation(cit.book_name, cit.page)}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-[#5B5FFF] cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-white">
                            <span className="truncate max-w-[170px]">{cit.book_name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5B5FFF]/30 text-[#38BDF8] font-mono flex items-center gap-1">
                              Page {cit.page} <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                            "{cit.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                {msg.sender === 'ai' && (
                  <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))
        )}

        {/* Thinking Indicator Animation */}
        {isGenerating && (
          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center text-white shadow-glow animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#5B5FFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-slate-400 font-medium">Libera is retrieving chunks from uploaded books...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fixed Bottom Query Input Bar */}
      <div className="p-4 bg-[#0B1120]/90 border-t border-slate-800/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-3 relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about your uploaded books..."
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl glass-input text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-[#5B5FFF]/50"
            />
            
            <button
              type="submit"
              disabled={!inputQuery.trim() || isGenerating}
              className="absolute right-2 top-2 p-2 rounded-xl bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-glow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {isGenerating && (
            <button
              type="button"
              onClick={onStopGenerating}
              className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-4 h-4 fill-rose-400" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}

          {!isGenerating && messages.length > 0 && (
            <button
              type="button"
              onClick={onRegenerate}
              className="p-3 rounded-2xl glass-panel border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Regenerate Last Answer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
