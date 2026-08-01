import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatArea } from './components/ChatArea';
import { BookManagementModal } from './components/BookManagementModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminModal } from './components/AdminModal';

import type { Book, Conversation, Message, User, AppSettings } from './types';
import { 
  fetchBooks, uploadBookFile, deleteBookApi, renameBookApi, 
  fetchHistory, sendChatMessage, fetchSettings, saveSettingsApi
} from './services/api';

export function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [user, setUser] = useState<User | null>({
    user_id: 'demo-user',
    name: 'Libera Scholar',
    email: 'scholar@libera.ai'
  });

  // App Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [selectedBookFilter, setSelectedBookFilter] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals visibility state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isBooksModalOpen, setIsBooksModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [activePdfBook, setActivePdfBook] = useState<Book | null>(null);
  const [pdfInitialPage, setPdfInitialPage] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'en',
    embeddingModel: 'BAAI/bge-small-en-v1.5',
    chunkSize: 800,
    chunkOverlap: 150,
    llmModel: 'llama-3.3-70b-versatile',
    vectorDb: 'ChromaDB',
    apiKey: '',
    systemPrompt: `You are Libera, an AI assistant that answers questions exclusively from the user's uploaded documents.
Rules:
1. Use only the retrieved document context.
2. Never use outside knowledge.
3. If the answer is not found in the uploaded books, reply: "I couldn't find this information in the uploaded books."
4. Cite every answer with the book name and page number.`
  });

  // Load initial Books, History & Settings
  useEffect(() => {
    fetchBooks(user?.user_id).then(setBooks);
    fetchSettings(user?.user_id).then(setSettings);
    fetchHistory(user?.user_id).then(convs => {
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      } else {
        setActiveConvId(null);
      }
    });
  }, [user?.user_id]);

  // Theme Toggler effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Upload Book
  const handleUploadFile = async (file: File) => {
    const uploaded = await uploadBookFile(file, user?.user_id);
    setBooks(prev => [uploaded, ...prev]);
  };

  // Delete Book
  const handleDeleteBook = async (bookId: string) => {
    await deleteBookApi(bookId, user?.user_id);
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  // Rename Book
  const handleRenameBook = async (bookId: string, newName: string) => {
    await renameBookApi(bookId, newName, user?.user_id);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, name: newName } : b));
  };

  // Open Citation PDF Preview
  const handleOpenCitation = (bookName: string, page: number) => {
    const matchedBook = books.find(b => b.name.toLowerCase() === bookName.toLowerCase() || b.filename.toLowerCase() === bookName.toLowerCase()) || books[0];
    if (matchedBook) {
      setActivePdfBook(matchedBook);
      setPdfInitialPage(page);
      setIsPdfModalOpen(true);
    }
  };

  // New Chat
  const handleNewChat = () => {
    setActiveConvId(null);
  };

  // Select Conversation
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
    }
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  // Send Message Routine
  const handleSendMessage = async (query: string) => {
    setIsGenerating(true);

    let currentConvId = activeConvId;
    let updatedConversations = [...conversations];

    // Create user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now()
    };

    if (!currentConvId) {
      currentConvId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: currentConvId,
        title: query.slice(0, 35) + (query.length > 35 ? '...' : ''),
        created_at: Date.now(),
        updated_at: Date.now(),
        messages: [userMsg]
      };
      updatedConversations = [newConv, ...updatedConversations];
      setActiveConvId(currentConvId);
    } else {
      updatedConversations = updatedConversations.map(c => {
        if (c.id === currentConvId) {
          return {
            ...c,
            updated_at: Date.now(),
            messages: [...c.messages, userMsg]
          };
        }
        return c;
      });
    }

    setConversations(updatedConversations);

    // Call RAG API / local grounded synthesis
    try {
      const result = await sendChatMessage(
        query,
        currentConvId,
        selectedBookFilter ? [selectedBookFilter] : undefined,
        user?.user_id
      );

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: result.answer,
        timestamp: Date.now(),
        citations: result.citations,
        books_used: result.books_used
      };

      setConversations(prev => prev.map(c => {
        if (c.id === currentConvId) {
          return { ...c, messages: [...c.messages, aiMsg] };
        }
        return c;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export Chat
  const handleExportChat = (format: 'markdown' | 'txt' | 'json') => {
    const activeConv = conversations.find(c => c.id === activeConvId);
    if (!activeConv) return;

    let content = '';
    if (format === 'markdown' || format === 'txt') {
      content = `# Libera Conversation Export: ${activeConv.title}\nDate: ${new Date(activeConv.created_at).toLocaleString()}\n\n`;
      activeConv.messages.forEach(m => {
        content += `### ${m.sender === 'user' ? 'User' : 'Libera AI'}\n${m.text}\n\n`;
        if (m.citations && m.citations.length > 0) {
          content += `*Sources:*\n` + m.citations.map(c => `- ${c.book_name} (Page ${c.page})`).join('\n') + '\n\n';
        }
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `libera_chat_${activeConv.id}.${format === 'markdown' ? 'md' : 'txt'}`;
    link.click();
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const currentMessages = activeConv ? activeConv.messages : [];

  return (
    <div className={`h-screen w-screen bg-[#0F172A] text-slate-100 overflow-hidden font-sans ${view === 'landing' ? 'overflow-y-auto' : 'flex'}`}>
      {view === 'landing' ? (
        <LandingPage
          onGetStarted={() => setView('dashboard')}
          onUploadClick={() => {
            setView('dashboard');
            setIsBooksModalOpen(true);
          }}
          onLoginClick={() => setIsAuthOpen(true)}
        />
      ) : (
        <div className="flex w-full h-full">
          {/* Collapsible Sidebar */}
          <Sidebar
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            books={books}
            onOpenBooksModal={() => setIsBooksModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsOpen(true)}
            onOpenAdminModal={() => setIsAdminOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Main Dashboard Panel */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            <Navbar
              user={user}
              books={books}
              selectedBookFilter={selectedBookFilter}
              onSelectBookFilter={setSelectedBookFilter}
              onQuickUpload={() => setIsBooksModalOpen(true)}
              theme={settings.theme}
              onToggleTheme={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
              onGoLanding={() => setView('landing')}
              onOpenAuth={() => setIsAuthOpen(true)}
              globalSearch={globalSearch}
              onGlobalSearchChange={setGlobalSearch}
              onOpenCitation={handleOpenCitation}
            />

            <ChatArea
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onStopGenerating={() => setIsGenerating(false)}
              onRegenerate={() => {
                if (currentMessages.length > 0) {
                  const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === 'user');
                  if (lastUserMsg) handleSendMessage(lastUserMsg.text);
                }
              }}
              onOpenCitation={handleOpenCitation}
              books={books}
              onOpenUpload={() => setIsBooksModalOpen(true)}
              onExportChat={handleExportChat}
            />
          </div>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />

      <BookManagementModal
        isOpen={isBooksModalOpen}
        onClose={() => setIsBooksModalOpen(false)}
        books={books}
        onUploadFile={handleUploadFile}
        onDeleteBook={handleDeleteBook}
        onRenameBook={handleRenameBook}
        onPreviewBook={(b) => {
          setActivePdfBook(b);
          setPdfInitialPage(1);
          setIsPdfModalOpen(true);
        }}
      />

      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        book={activePdfBook}
        initialPage={pdfInitialPage}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (newSettings) => {
          await saveSettingsApi(newSettings, user?.user_id);
          setSettings(newSettings);
        }}
        onClearHistory={() => setConversations([])}
        onClearBooks={() => setBooks([])}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default App;
