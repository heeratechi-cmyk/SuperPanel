import React, { useState } from 'react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onNavigate: (route: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const { login, addToast } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast('Please enter both username/email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      setLoading(false);
      onNavigate('/');
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950 border border-indigo-900/60 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block mb-2">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-bold text-white">Client Portal Login</h1>
          <p className="text-xs text-slate-400">
            Sign in to access your dashboard and services
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username or email address..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-indigo-900/40 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900 border border-indigo-900/40 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          Don't have an account yet?{' '}
          <button
            onClick={() => onNavigate('/signup')}
            className="text-indigo-400 hover:text-indigo-300 font-bold ml-1"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

