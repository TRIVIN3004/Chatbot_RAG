import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Sparkles, UploadCloud, Search, ShieldCheck, 
  FileText, Database, Layers, ArrowRight, CheckCircle2, 
  Code2, MessageSquare, Terminal, Zap, BookMarked
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onUploadClick: () => void;
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onUploadClick,
  onLoginClick,
}) => {
  const [demoQuery, setDemoQuery] = useState('What is virtual memory and page table?');
  const [demoActive, setDemoActive] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#5B5FFF]/20 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[#38BDF8]/15 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] bg-[#7B61FF]/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0F172A]/75 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center shadow-glow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Libera <span className="text-xs px-2 py-0.5 rounded-full bg-[#5B5FFF]/20 border border-[#5B5FFF]/40 text-[#38BDF8]">RAG v1.0</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-white transition-colors">RAG Architecture</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] hover:opacity-95 shadow-glow transition-all active:scale-95 flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5B5FFF]/10 border border-[#5B5FFF]/30 text-[#38BDF8] text-xs font-semibold uppercase tracking-wider mb-6 mx-auto"
        >
          <Sparkles className="w-4 h-4 text-[#38BDF8]" />
          Zero-Hallucination Document Intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight"
        >
          Learn from Your Books.{' '}
          <span className="gradient-text">Ask Anything.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Upload up to 4 textbooks or research PDFs. Libera chunks, embeds, and retrieves exact page & paragraph citations for answers strictly grounded in your documents.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onUploadClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] hover:shadow-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <UploadCloud className="w-5 h-5" />
            Upload Books (PDF)
          </button>

          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-slate-200 glass-panel-interactive hover:text-white flex items-center justify-center gap-3"
          >
            <MessageSquare className="w-5 h-5 text-[#38BDF8]" />
            Ask Questions
          </button>
        </motion.div>

        {/* Value Prop Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left"
        >
          {[
            { icon: FileText, title: "PDF & DOCX Upload", desc: "Process up to 4 books with page metadata" },
            { icon: Database, title: "Vector Embeddings", desc: "800-char chunks & BAAI/bge vector index" },
            { icon: ShieldCheck, title: "No Hallucinations", desc: "Answers derived strictly from document context" },
            { icon: BookMarked, title: "Page Citations", desc: "Clickable book, page & paragraph sources" },
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-[#5B5FFF]/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#5B5FFF]/15 border border-[#5B5FFF]/30 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* RAG Pipeline Breakdown */}
      <section id="pipeline" className="py-16 px-6 bg-[#0B1120] border-y border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">End-to-End RAG Architecture</h2>
            <p className="text-slate-400 mt-2 text-sm">How Libera converts raw PDF pages into precise, verifiable answers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { step: "01", name: "Text Extraction", detail: "PyMuPDF & pypdf parse text with exact page boundaries." },
              { step: "02", name: "Chunk & Split", detail: "800 character chunk size with 150 character overlap." },
              { step: "03", name: "Vector Indexing", detail: "Generate embeddings & index into ChromaDB / Vector Store." },
              { step: "04", name: "Grounded Generation", detail: "Retrieve top 5 chunks + enforce zero-outside knowledge LLM prompt." }
            ].map((st, i) => (
              <div key={i} className="p-6 rounded-2xl glass-panel relative">
                <span className="text-3xl font-black text-[#5B5FFF]/40 mb-2 block">{st.step}</span>
                <h4 className="text-lg font-bold text-white mb-1">{st.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Checklist */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-semibold uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5" /> Built for Researchers & Students
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              ChatGPT Simplicity with Guaranteed Citation Accuracy
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Say goodbye to AI hallucinations. Libera compares user queries against embedded book vectors, retrieves the top 5 relevant passages, and synthesizes answers with source verification.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "PDF, DOCX & TXT Document Upload Support",
                "Hybrid Semantic + Keyword Search Engine",
                "Exact Page & Paragraph Citation Verification",
                "Full History Storage & Chat Export (PDF, MD, TXT)",
                "Customizable System Prompt & Chunking Rules",
                "Dark & Light Mode Glassmorphic Theme"
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onGetStarted}
              className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] text-white font-semibold text-sm hover:shadow-glow transition-all"
            >
              Open Dashboard & Chat
            </button>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-700/60 shadow-glass">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">libera_rag_demo.py</span>
              </div>
              <span className="text-xs text-[#10B981] flex items-center gap-1 font-mono">● Grounded</span>
            </div>

            <div className="mt-4 space-y-4 font-mono text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[#38BDF8]">Prompt:</span> {demoQuery}
              </div>

              <div className="p-3 rounded-lg bg-[#5B5FFF]/10 border border-[#5B5FFF]/30 text-slate-200 space-y-2">
                <div className="text-[#38BDF8] font-bold">Retrieved Context (Top 2 Chunks):</div>
                <div className="text-slate-300">1. Operating Systems.pdf [Page 76] (Score: 0.94)</div>
                <div className="text-slate-300">2. Computer Networks.pdf [Page 142] (Score: 0.88)</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 leading-relaxed">
                <p><span className="text-[#10B981] font-bold">Answer:</span> Virtual memory allows execution of processes that are not completely in physical memory. The Page Table translates virtual addresses into physical addresses.</p>
                <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span className="text-slate-300 font-semibold">Sources:</span> Operating Systems.pdf (Page 76), Computer Networks.pdf (Page 142)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="mt-auto border-t border-slate-800/80 py-8 px-6 bg-[#0B1120] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#5B5FFF]" />
            <span className="font-bold text-white text-sm">Libera</span>
            <span>– Learn from Your Books. Ask Anything.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
