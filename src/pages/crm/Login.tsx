import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/auth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function CrmLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user) {
        if (user.role === 'Manager') navigate('/manager');
        else if (user.role === 'CEO') navigate('/ceo/dashboard');
        else if (user.role === 'DM') navigate('/dm/dashboard');
        else if (user.role === 'Teacher') navigate('/teacher');
        else if (user.role === 'Student') navigate('/student');
        else navigate('/sales/dashboard');
      } else {
        setError('Invalid email or password.');
      }
    } catch {
      setError('Login failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a14] p-4 transition-colors duration-300">
      
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight">
          Cynex<span className="text-indigo-600 dark:text-indigo-400">AI</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Learning Management System</p>
      </div>

      {/* Main login card */}
      <div className="w-full max-w-sm bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 shadow-xl rounded-2xl p-8 relative overflow-hidden">
        
        {/* Subtle gradient accent for premium feel */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Sign in to your portal</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          <div>
            <input
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 font-medium text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPw(!showPw)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-lg mt-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:shadow-none mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
      
      {/* Footer / Info */}
      <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} CynexAI. All rights reserved.
      </div>
    </div>
  );
}
