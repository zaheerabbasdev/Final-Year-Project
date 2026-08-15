'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${api.baseUrl}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Cannot reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      {/* Subtle background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-3xl shadow-2xl shadow-black/10 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap size={28} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Admin Console</h1>
              <p className="text-sm text-[var(--subtext)] mt-0.5">Kaarkun Marketplace Management</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--subtext)] uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtext)] pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@kaarkun.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)] placeholder-[var(--subtext)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--subtext)] uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtext)] pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text)] placeholder-[var(--subtext)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--subtext)] hover:text-[var(--text)] transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--subtext)] mt-6">
          Kaarkun Admin · Restricted Access Only
        </p>
      </div>
    </div>
  );
}
