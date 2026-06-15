'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import {
  Bell,
  Menu,
  Sun,
  Moon,
  X,
  CheckCheck,
  Sparkles
} from 'lucide-react';

const PAGE_META: Record<string, { title: string; sub: string; icon: string }> = {
  '/customer/dashboard':   { title: 'Dashboard',       sub: 'Overview & analytics',       icon: '⚡' },
  '/customer/post-job':    { title: 'Post a Job',      sub: 'Create a new job listing',    icon: '📋' },
  '/customer/jobs':        { title: 'My Jobs',         sub: 'Manage your job posts',       icon: '💼' },
  '/customer/bookings':    { title: 'My Bookings',     sub: 'Active & past service hires', icon: '📅' },
  '/provider/dashboard':   { title: 'Dashboard',       sub: 'Performance & activity',      icon: '⚡' },
  '/provider/browse-jobs': { title: 'Browse Jobs',     sub: 'Find jobs that match you',    icon: '🔍' },
  '/provider/bids':        { title: 'My Bids',         sub: 'Track your proposals',        icon: '⚖️' },
  '/chat':                 { title: 'Messages',         sub: 'Chat with clients & providers', icon: '💬' },
  '/notifications':        { title: 'Notifications',   sub: 'Alerts and updates',          icon: '🔔' },
  '/profile':              { title: 'My Profile',      sub: 'Edit your information',       icon: '👤' },
  '/support-chatbot':      { title: 'AI Assistant',    sub: 'Get smart help',              icon: '🤖' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const countData = await api.get('/notifications/unread-count');
      setUnreadCount(countData.count || 0);
      const notifData = await api.get('/notifications');
      setNotifications(Array.isArray(notifData) ? notifData : notifData.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSidebar = () => window.dispatchEvent(new Event('toggle-sidebar'));

  const getPageMeta = () => {
    for (const [key, val] of Object.entries(PAGE_META)) {
      if (pathname === key || pathname.startsWith(key + '/')) return val;
    }
    return { title: 'Kaarkun', sub: '', icon: '⚡' };
  };

  const meta = getPageMeta();
  const avatarInitial = user?.full_name?.charAt(0)?.toUpperCase() || '?';
  const isCustomer = user?.role === 'customer';
  const roleGradient = isCustomer ? 'from-blue-500 to-cyan-400' : 'from-violet-500 to-indigo-500';

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-zinc-100 dark:border-white/[0.06] transition-colors duration-300">
      <div className="px-5 h-[70px] flex items-center justify-between gap-4">

        {/* Left: Hamburger + Page title */}
        <div className="flex items-center gap-4 min-w-0">
          {user && (
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 -ml-1.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
          )}

          {!user && (
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles size={15} className="text-white" />
              </div>
              <span className="text-xl font-black gradient-text">Kaarkun</span>
            </Link>
          )}

          {user && (
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              <div className="text-2xl shrink-0 leading-none">{meta.icon}</div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight truncate">
                  {meta.title}
                </h1>
                {meta.sub && (
                  <p className="text-xs text-zinc-400 leading-tight truncate">{meta.sub}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              {/* Role pill */}
              <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${roleGradient} shadow-sm`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                {isCustomer ? 'Customer' : 'Provider'}
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-indigo-500" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0a0a0f]" />
                  )}
                </button>

                {/* Notifications panel */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-[340px] bg-white dark:bg-[#13131e] border border-zinc-100 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06] flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <p className="text-xs text-zinc-400">{unreadCount} unread</p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                        >
                          <CheckCheck size={12} />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-3xl mb-2">🔔</div>
                          <p className="text-sm text-zinc-400">You're all caught up!</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 border-b border-zinc-50 dark:border-white/[0.04] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors ${
                              !notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 pl-2.5 border-l border-zinc-100 dark:border-white/[0.08] hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-right min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
                {user.avatar ? (
                  <img
                    src={`http://localhost:5000${user.avatar}`}
                    alt={user.full_name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {avatarInitial}
                  </div>
                )}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-indigo-500" />
                )}
              </button>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
