import { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}

export function AuthModal({ onClose, theme }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const cardBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50';
  const cardBorderClass = theme === 'dark' ? 'border-zinc-800' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textMutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const inputBgClass = theme === 'dark' ? 'bg-zinc-950' : 'bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${cardBgClass} rounded-2xl shadow-2xl border ${cardBorderClass} max-w-md w-full`} onClick={(e) => e.stopPropagation()}>
        <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-6 py-4 border-b ${cardBorderClass} flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${textClass} flex items-center gap-2`}>
            {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-300'} rounded-lg transition-all`}
          >
            <X className={`w-5 h-5 ${textMutedClass}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${textClass} mb-2`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textMutedClass}`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full ${inputBgClass} ${textClass} pl-10 pr-4 py-2.5 rounded-lg border ${cardBorderClass} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${textClass} mb-2`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textMutedClass}`} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full ${inputBgClass} ${textClass} pl-10 pr-4 py-2.5 rounded-lg border ${cardBorderClass} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Loading...'
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Sign Up
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className={`${textMutedClass} hover:${textClass} text-sm transition-colors`}
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
