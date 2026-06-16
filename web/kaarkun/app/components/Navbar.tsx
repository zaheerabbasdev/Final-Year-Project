'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { api } from '../utils/api';
import {
  Bell,
  Menu,
  Sun,
  Moon,
  X,
  CheckCheck,
  Sparkles,
  Globe
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
  const { selectedCurrency, setCurrency } = useCurrency();
  const pathname = usePathname();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const currencyRef = useRef<HTMLDivElement>(null);
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
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setShowCurrencyDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
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

  const handleMarkOneRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
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
    <>
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

              {/* Currency Selector */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  title="Select Application Currency"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all border border-zinc-100 dark:border-white/[0.08]"
                >
                  <Globe size={16} className="text-indigo-500" />
                  <span>{selectedCurrency}</span>
                </button>

                {showCurrencyDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#13131e] border border-zinc-100 dark:border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Currency
                    </div>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => {
                          setCurrency(curr.code);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center transition-colors ${
                          selectedCurrency === curr.code
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <span>{curr.name}</span>
                        <span className="text-[10px] font-mono opacity-80">{curr.code} ({curr.symbol})</span>
                      </button>
                    ))}
                  </div>
                )}
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

              {/* Notifications dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0a0a0f]" />
                  )}
                </button>

                {showNotificationsDropdown && (
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
                            onClick={() => {
                              if (!notif.is_read) {
                                handleMarkOneRead(notif.id);
                              }
                              setSelectedNotification(notif);
                              setShowNotificationsDropdown(false);
                            }}
                            className={`px-4 py-3 border-b border-zinc-50 dark:border-white/[0.04] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer relative ${
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

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#13131e] border border-zinc-100 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl shrink-0 mt-0.5">
                <Bell size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-950 dark:text-white text-base leading-tight">
                  {selectedNotification.title}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-zinc-100 dark:border-white/[0.04] mb-4">
              {selectedNotification.message}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

