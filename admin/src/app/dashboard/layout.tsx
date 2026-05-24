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
        <header className="h-16 bg-[var(--surface)] border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-[var(--text)] uppercase tracking-[0.12em]">Management Console</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-[var(--text)]">{user?.full_name || 'Admin User'}</p>
              <p className="text-xs text-[var(--subtext)]">{user?.email || 'Administrator'}</p>
            </div>
            <div className="h-10 w-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] font-bold border border-white shadow-sm">
              {user?.full_name?.charAt(0) || 'A'}
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
