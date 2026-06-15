'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users,
  Search,
  Briefcase, 
  Scale,
  FolderOpen,
  MessageSquare, 
  LogOut,
  X,
  Menu
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!user) return null;

  const dashboardSubtitle = user.role === 'customer' ? 'Customer Dashboard' : 'Provider Dashboard';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 
        transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* Branding Header */}
        <div className="h-24 px-6 flex items-center justify-between md:justify-start gap-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
              K
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                Kaarkun
              </h1>
              <p className="text-[11px] text-zinc-500 font-medium">
                {dashboardSubtitle}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-zinc-400 hover:text-zinc-600">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {user.role === 'customer' && (
            <>
              <Link 
                href="/customer/dashboard" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  pathname === '/customer/dashboard' 
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <LayoutDashboard size={18} className={pathname === '/customer/dashboard' ? 'text-blue-600' : 'text-zinc-400'} />
                Dashboard
              </Link>
              <Link 
                href="/customer/post-job" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  pathname === '/customer/post-job' 
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Briefcase size={18} className={pathname === '/customer/post-job' ? 'text-rose-600' : 'text-zinc-400'} />
                Post Job
              </Link>
            </>
          )}

          {user.role === 'provider' && (
            <>
              <Link 
                href="/provider/dashboard" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  pathname === '/provider/dashboard' 
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <LayoutDashboard size={18} className={pathname === '/provider/dashboard' ? 'text-blue-600' : 'text-zinc-400'} />
                Dashboard
              </Link>
              <Link 
                href="/provider/browse-jobs" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  pathname === '/provider/browse-jobs' 
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Search size={18} className={pathname === '/provider/browse-jobs' ? 'text-amber-500' : 'text-zinc-400'} />
                Browse Jobs
              </Link>
              <Link 
                href="/provider/bids" 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  pathname === '/provider/bids' 
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Scale size={18} className={pathname === '/provider/bids' ? 'text-orange-500' : 'text-zinc-400'} />
                My Bids
              </Link>
            </>
          )}

          <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-2 mx-4" />

          <Link 
            href="/chat" 
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              pathname === '/chat' 
                ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 shadow-sm' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <MessageSquare size={18} className={pathname === '/chat' ? 'text-indigo-500' : 'text-zinc-400'} />
            Messages
          </Link>
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-400"
          >
            <LogOut size={18} className="text-orange-700/70" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
