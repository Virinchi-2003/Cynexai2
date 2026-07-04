import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../lib/auth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const QUICK_LOGINS = [
  { label: 'Teacher', emoji: '👨‍🏫', email: 'teacher@cynexai.com', password: 'admin123', color: 'from-indigo-600 to-indigo-800', route: '/teacher' },
  { label: 'Student', emoji: '📚', email: 'student@cynexai.com', password: 'admin123', color: 'from-green-600 to-green-800', route: '/student' },
  { label: 'Manager', emoji: '🏢', email: 'manager@cynexai.com', password: 'admin123', color: 'from-purple-600 to-purple-800', route: '/manager' },
  { label: 'CEO', emoji: '👑', email: 'ceo@cynexai.com', password: 'admin123', color: 'from-yellow-600 to-orange-700', route: '/ceo/dashboard' },
  { label: 'Sales', emoji: '💼', email: 'sandeep.cynexai@gmail.com', password: 'Sandeep@142', color: 'from-sky-600 to-sky-800', route: '/sales/dashboard' },
  { label: 'Marketer', emoji: '📣', email: 'dm@cynexai.com', password: 'admin123', color: 'from-pink-600 to-pink-800', route: '/dm/dashboard' },
];

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
        else navigate('/sales/pipeline');
      } else {
        setError('Invalid email or password.');
      }
    } catch {
      setError('Login failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (cred: typeof QUICK_LOGINS[0]) => {
    setLoading(true);
    setError('');
    try {
      const user = await login(cred.email, cred.password);
      if (user) navigate(cred.route);
      else setError('Quick login failed. Try manual login.');
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

      {/* Quick login grid */}
      <div className="w-full max-w-sm">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest text-center mb-3">Quick Demo Login</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_LOGINS.map(cred => (
            <button
              key={cred.label}
              onClick={() => handleQuickLogin(cred)}
              disabled={loading}
              className={`bg-gradient-to-br ${cred.color} hover:opacity-90 rounded-xl p-3 text-center font-bold text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg`}
            >
              <div className="text-2xl mb-1">{cred.emoji}</div>
              <div className="text-xs">{cred.label}</div>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-700 text-xs mt-3">Password for all demo accounts: <code className="text-slate-500">admin123</code></p>
      </div>
    </div>
  );
}
