'use client';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/ThemeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    const userData = localStorage.getItem('adminUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">
      <Sidebar />
      <main className="pl-64 min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-20 border-b border-[var(--border-color)] bg-[var(--surface)]/95 backdrop-blur-xl shadow-sm transition-colors duration-200">
          <div className="h-20 px-10 flex items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--subtext)]">Admin Panel</p>
              <h1 className="text-2xl font-extrabold text-[var(--text)]">Management Console</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="h-11 w-11 flex items-center justify-center rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xl"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
              <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--primary)]">Live</div>
              <div className="flex items-center gap-3 rounded-3xl bg-[var(--surface)] border border-[var(--border-color)] px-4 py-2 shadow-sm transition-colors duration-200">
                <div className="h-11 w-11 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--text)]">{user?.full_name || 'Admin User'}</p>
                  <p className="text-sm text-[var(--subtext)]">{user?.email || 'Administrator'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-[1480px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
