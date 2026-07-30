import React, { useState } from 'react';
import { 
  BookOpen, Plus, MessageSquare, BookMarked, Settings, 
  BarChart3, Trash2, Edit2, Check, X, Search, ChevronLeft, 
  ChevronRight, UploadCloud, FileText, Sparkles
} from 'lucide-react';
import { Book, Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  books: Book[];
  onOpenBooksModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAdminModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  books,
  onOpenBooksModal,
  onOpenSettingsModal,
  onOpenAdminModal,
  isCollapsed,
  onToggleCollapse
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <aside className={`relative flex flex-col h-full bg-[#0B1120] border-r border-slate-800/80 transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#5B5FFF] shadow-md z-40 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center shadow-glow flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Libera</h1>
              <span className="text-[10px] text-[#38BDF8] font-medium tracking-wide">RAG ASSISTANT</span>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full py-3 rounded-xl bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] text-white font-semibold text-sm hover:shadow-glow transition-all flex items-center justify-center gap-2 active:scale-95 ${isCollapsed ? 'px-0' : 'px-4'}`}
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Uploaded Books Counter & Widget */}
      {!isCollapsed ? (
        <div className="mx-3 my-2 p-3 rounded-xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5 text-white">
              <BookMarked className="w-3.5 h-3.5 text-[#38BDF8]" /> Books ({books.length}/4)
            </span>
            <button
              onClick={onOpenBooksModal}
              className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1"
            >
              Manage
            </button>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-[#5B5FFF] to-[#38BDF8] h-full rounded-full transition-all duration-300"
              style={{ width: `${(books.length / 4) * 100}%` }}
            />
          </div>

          <div className="space-y-1">
            {books.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-[11px] text-slate-300 truncate py-0.5">
                <span className="truncate max-w-[170px]">• {b.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">P.{b.pages}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center my-2">
          <button
            onClick={onOpenBooksModal}
            className="p-2.5 rounded-xl glass-panel border border-slate-800 text-slate-300 hover:text-white"
            title={`Uploaded Books (${books.length}/4)`}
          >
            <BookMarked className="w-5 h-5 text-[#38BDF8]" />
          </button>
        </div>
      )}

      {/* History Search & Conversation List */}
      {!isCollapsed && (
        <div className="px-3 py-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg glass-input text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredConversations.length === 0 && !isCollapsed && (
          <div className="p-4 text-center text-xs text-slate-500">
            No history yet. Start a new chat!
          </div>
        )}

        {filteredConversations.map((conv) => {
          const isActive = conv.id === activeConvId;
          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${isActive ? 'bg-[#5B5FFF]/20 text-white border border-[#5B5FFF]/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              title={conv.title}
            >
              <div className="flex items-center gap-2.5 truncate pr-2">
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-slate-500'}`} />
                {!isCollapsed && (
                  editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-900 border border-slate-700 text-xs text-white px-1.5 py-0.5 rounded w-36 outline-none"
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )
                )}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === conv.id ? (
                    <button
                      onClick={(e) => handleSaveRename(conv.id, e)}
                      className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 text-slate-400 hover:text-white rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <button
          onClick={onOpenSettingsModal}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title="Settings"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={onOpenAdminModal}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title="Admin Insights"
        >
          <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
          {!isCollapsed && <span>Admin Analytics</span>}
        </button>
      </div>
    </aside>
  );
};
