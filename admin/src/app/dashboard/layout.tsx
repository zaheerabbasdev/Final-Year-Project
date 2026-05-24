'use client';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="pl-72 min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[var(--surface)]/95 backdrop-blur-xl shadow-sm">
          <div className="h-20 px-10 flex items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--subtext)]">Admin Panel</p>
              <h1 className="text-2xl font-extrabold text-[var(--text)]">Management Console</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-3xl border border-slate-200/80 bg-[var(--primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--primary)]">Live</div>
              <div className="flex items-center gap-3 rounded-3xl bg-[var(--surface)] border border-slate-200 px-4 py-2 shadow-sm">
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
