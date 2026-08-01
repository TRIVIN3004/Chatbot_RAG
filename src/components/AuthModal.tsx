import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [googleClientConfigured, setGoogleClientConfigured] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const isConfigured = clientId && !clientId.includes("your-google-client-id-here");
    setGoogleClientConfigured(!!isConfigured);

    if (!isConfigured) return;

    const google = (window as any).google;

    const initializeGoogleSignIn = () => {
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        
        const btnContainer = document.getElementById("google-signin-btn");
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            width: 320,
            text: "continue_with"
          });
        }
      }
    };

    if (google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        const currentGoogle = (window as any).google;
        if (currentGoogle?.accounts?.id) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      if (res.ok) {
        const userData = await res.json();
        onLoginSuccess(userData);
        onClose();
      } else {
        const errData = await res.json();
        setMsg(errData.detail || 'Google Authentication failed.');
      }
    } catch (e) {
      console.error(e);
      setMsg('Failed to contact authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    setTimeout(() => {
      setLoading(false);
      if (tab === 'forgot') {
        setMsg('Password reset link sent to your email.');
        return;
      }

      const loggedUser: User = {
        user_id: `user-${Date.now()}`,
        name: name || email.split('@')[0] || 'Libera User',
        email: email || 'user@libera.ai'
      };

      onLoginSuccess(loggedUser);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#38BDF8] flex items-center justify-center mx-auto mb-3 shadow-glow">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {tab === 'login' ? 'Welcome Back' : tab === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'login' ? 'Access your Libera books and chat history' : tab === 'signup' ? 'Start asking questions from your PDF textbooks' : 'Enter your email to receive recovery instructions'}
          </p>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs text-center font-medium">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-xs text-[#38BDF8] hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5B5FFF] to-[#7B61FF] text-white font-bold text-sm hover:opacity-95 shadow-glow transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Send Reset Link'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
          <span className="relative px-3 text-[11px] bg-[#0F172A] text-slate-500 uppercase tracking-wider">or continue with</span>
        </div>

        {googleClientConfigured ? (
          <div className="w-full flex justify-center my-4">
            <div id="google-signin-btn" className="w-full max-w-sm flex justify-center" />
          </div>
        ) : (
          <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-amber-500/20 text-amber-400 text-[11px] my-4 leading-relaxed">
            ⚠️ <strong>Google Client ID not configured.</strong><br />
            Add your Client ID to the root <code>.env</code> file to enable Google Login.
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          {tab === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setTab('signup')} className="text-[#38BDF8] font-semibold hover:underline">
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setTab('login')} className="text-[#38BDF8] font-semibold hover:underline">
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
