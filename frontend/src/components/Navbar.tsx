import React from 'react';
import { 
  Search, Sun, Moon, UploadCloud, User as UserIcon, 
  BookOpen, Filter, LogOut, Home
} from 'lucide-react';
import { Book, User } from '../types';

interface NavbarProps {
  user: User | null;
  books: Book[];
  selectedBookFilter: string | null;
  onSelectBookFilter: (bookId: string | null) => void;
  onQuickUpload: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onGoLanding: () => void;
  onOpenAuth: () => void;
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  books,
  selectedBookFilter,
  onSelectBookFilter,
  onQuickUpload,
  theme,
  onToggleTheme,
  onGoLanding,
  onOpenAuth,
  globalSearch,
  onGlobalSearchChange,
  onLogout
}) => {
  return (
    <header className="h-16 px-6 bg-[#0B1120]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 z-20">
      {/* Search & Book Filter */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Search across uploaded books or chat context..."
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-400"
          />
        </div>

        {/* Book Selector Filter */}
        <div className="relative hidden sm:block">
          <select
            value={selectedBookFilter || ''}
            onChange={(e) => onSelectBookFilter(e.target.value ? e.target.value : null)}
            className="bg-[#1E293B] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#5B5FFF] cursor-pointer"
          >
            <option value="">All Books ({books.length})</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name.length > 25 ? b.name.slice(0, 25) + '...' : b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onQuickUpload}
          className="px-3 py-2 rounded-xl bg-[#5B5FFF]/20 border border-[#5B5FFF]/40 text-[#38BDF8] hover:bg-[#5B5FFF]/30 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden md:inline">Upload PDF</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl glass-panel border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        <button
          onClick={onGoLanding}
          className="p-2 rounded-xl glass-panel border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Back to Landing Page"
        >
          <Home className="w-4 h-4" />
        </button>

        {user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col hidden lg:flex">
              <span className="text-xs font-semibold text-slate-200 leading-none">{user.name}</span>
              <span className="text-[10px] text-slate-400 leading-none mt-0.5">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
