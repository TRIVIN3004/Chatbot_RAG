import React, { useEffect, useState } from 'react';
import { 
  X, BarChart3, Users, HardDrive, Database, MessageSquare, 
  BookOpen, CheckCircle, Activity, Server
} from 'lucide-react';
import { AdminStats } from '../types';
import { fetchAdminStats } from '../services/api';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAdminStats().then(data => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center shadow-glow">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Libera Admin Analytics & Health</h2>
            <p className="text-xs text-slate-400">System storage, vector index status, active sessions, and usage metrics</p>
          </div>
        </div>

        {loading || !stats ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading system metrics...</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl glass-panel border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-[#38BDF8]" /> Total Users
                </div>
                <span className="text-2xl font-extrabold text-white">{stats.total_users}</span>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <BookOpen className="w-4 h-4 text-[#5B5FFF]" /> Total Books
                </div>
                <span className="text-2xl font-extrabold text-white">{stats.total_books}</span>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <HardDrive className="w-4 h-4 text-amber-400" /> Storage Used
                </div>
                <span className="text-2xl font-extrabold text-white">{stats.total_storage_mb} MB</span>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> Active Chats
                </div>
                <span className="text-2xl font-extrabold text-white">{stats.total_active_chats}</span>
              </div>
            </div>

            {/* Vector DB & Server Health */}
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#38BDF8]" /> Vector Database & Indexing Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <span>Total Embedded Chunks:</span>
                  <span className="font-mono font-bold text-white">{stats.total_embedded_chunks.toLocaleString()}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <span>Total Parsed Pages:</span>
                  <span className="font-mono font-bold text-white">{stats.total_pages.toLocaleString()}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <span>Vector Index Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {stats.vector_index_status}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <span>Server Uptime:</span>
                  <span className="text-[#38BDF8] font-mono font-bold">{stats.server_uptime}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
