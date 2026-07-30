import React, { useState } from 'react';
import { 
  X, Settings as SettingsIcon, Sliders, Database, Cpu, 
  Trash2, ShieldCheck, Check, Sparkles, AlertTriangle
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearHistory: () => void;
  onClearBooks: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearHistory,
  onClearBooks
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center shadow-glow">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System Settings & RAG Pipeline Config</h2>
            <p className="text-xs text-slate-400">Configure embedding models, vector chunking rules, and LLM grounding</p>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" /> Settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* RAG Pipeline Configurations */}
          <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#38BDF8]" /> RAG Chunking Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chunk Size (Characters)</label>
                <input
                  type="number"
                  value={formData.chunkSize}
                  onChange={(e) => setFormData({ ...formData, chunkSize: parseInt(e.target.value) || 800 })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 800 chars (optimal for textbooks)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chunk Overlap (Characters)</label>
                <input
                  type="number"
                  value={formData.chunkOverlap}
                  onChange={(e) => setFormData({ ...formData, chunkOverlap: parseInt(e.target.value) || 150 })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 150 chars overlap</span>
              </div>
            </div>
          </div>

          {/* AI Models & Vector Database */}
          <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#7B61FF]" /> Embedding Model & Vector DB
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Embedding Model</label>
                <select
                  value={formData.embeddingModel}
                  onChange={(e) => setFormData({ ...formData, embeddingModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="BAAI/bge-small-en-v1.5">BAAI/bge-small-en-v1.5 (Recommended)</option>
                  <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Fast)</option>
                  <option value="OpenAI text-embedding-3-small">OpenAI text-embedding-3-small</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vector Database Engine</label>
                <select
                  value={formData.vectorDb}
                  onChange={(e) => setFormData({ ...formData, vectorDb: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="ChromaDB">ChromaDB (Local Persistent)</option>
                  <option value="FAISS">FAISS Vector Index</option>
                  <option value="Qdrant">Qdrant Cloud</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">LLM Model</label>
                <select
                  value={formData.llmModel}
                  onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="GPT-4.1 / GPT-5 Compatible">OpenAI GPT-4.1 / GPT-5 Compatible API</option>
                  <option value="Local Llama 3.1 8B">Local Llama 3.1 8B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">API Key (Optional)</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* System Prompt Rules */}
          <div className="p-4 rounded-xl glass-panel border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" /> System Grounding Prompt
            </h3>
            <textarea
              rows={4}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full p-3 rounded-xl glass-input text-xs text-slate-200 font-mono"
            />
          </div>

          {/* Danger Zone */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
            <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onClearHistory}
                className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Chat History
              </button>

              <button
                type="button"
                onClick={onClearBooks}
                className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All Uploaded Books
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] text-white font-bold text-sm hover:opacity-95 shadow-glow transition-all"
            >
              Save System Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
