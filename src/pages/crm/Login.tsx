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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a14] p-4 gap-6">
      {/* Brand */}
      <div className="text-center mb-2">
        <div className="text-4xl font-display font-black text-white tracking-tight">
          Cynex<span className="text-indigo-400">AI</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">Learning Management System</p>
      </div>

      {/* Main login card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
        <h2 className="text-lg font-bold text-white mb-5">Sign in to your portal</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-medium text-white text-sm outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 font-medium text-white text-sm outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>


    </div>
  );
}
