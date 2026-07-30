import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Sun, Moon, UploadCloud, User as UserIcon, 
  BookOpen, Filter, LogOut, Home, ExternalLink, BookMarked, X
} from 'lucide-react';
import type { Book, User, Citation } from '../types';
import { searchBookChunks } from '../services/api';

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
  onOpenCitation: (bookName: string, page: number) => void;
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
  onOpenCitation
}) => {
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live search debounce effect
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const timer = setTimeout(() => {
      searchBookChunks(globalSearch, selectedBookFilter, user?.user_id)
        .then(results => {
          setSearchResults(results);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [globalSearch, selectedBookFilter, user?.user_id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 px-6 bg-[#0B1120]/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 z-20 flex-shrink-0">
      {/* Search & Book Filter */}
      <div className="flex items-center gap-3 flex-1 max-w-xl relative" ref={dropdownRef}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            onFocus={() => { if (globalSearch.trim()) setShowDropdown(true); }}
            placeholder="Search inside uploaded books..."
            className="w-full pl-9 pr-8 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-400"
          />
          {globalSearch && (
            <button
              onClick={() => onGlobalSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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

        {/* Live Search Results Dropdown Overlay */}
        {showDropdown && (
          <div className="absolute top-12 left-0 w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Search Results for "{globalSearch}"</span>
              {isSearching && <span className="text-[10px] text-[#38BDF8] animate-pulse">Searching...</span>}
            </div>

            {searchResults.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching excerpts found for "{globalSearch}". Try another query!
              </div>
            ) : (
              searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onOpenCitation(res.book_name, res.page);
                    setShowDropdown(false);
                  }}
                  className="p-3 rounded-xl hover:bg-[#5B5FFF]/20 cursor-pointer transition-all border border-transparent hover:border-[#5B5FFF]/40 group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span className="truncate max-w-[280px] flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-[#38BDF8]" /> {res.book_name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#5B5FFF]/30 text-[#38BDF8] font-mono flex items-center gap-1">
                      Page {res.page} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                    "{res.snippet}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}
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
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden lg:inline">{user.name}</span>
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
