'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { api, getFileUrl } from '../utils/api';
import {
  Bell,
  Menu,
  Sun,
  Moon,
  X,
  CheckCheck,
  Zap,
  Globe,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { selectedCurrency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
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
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setAvatarBroken(false); }, [user?.avatar]);

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

  const avatarInitial = user?.full_name?.charAt(0)?.toUpperCase() || '?';
  const isCustomer = user?.role === 'customer';
  const roleGradient = isCustomer ? 'from-blue-500 to-sky-400' : 'from-blue-600 to-sky-500';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b1120]/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.06] transition-colors duration-300">
        <div className="px-5 h-[70px] flex items-center justify-between gap-4">

        {/* Left: Hamburger + Page title */}
        <div className="flex items-center gap-4 min-w-0">
          {user && (
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 -ml-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
          )}

          {!user && (
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Zap size={15} className="text-white" />
              </div>
              <span className="text-xl font-black gradient-text">Kaarkun</span>
            </Link>
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-100 dark:border-white/[0.08]"
                >
                  <Globe size={16} className="text-blue-500" />
                  <span>{selectedCurrency}</span>
                </button>

                {showCurrencyDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[var(--card-bg)] border border-slate-100 dark:border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
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
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-blue-500" />
                )}
              </button>

              {/* Language picker */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  <Globe size={14} />
                  <span>{lang === 'en' ? 'EN' : 'اردو'}</span>
                </button>
                {showLangDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-[var(--card-bg)] border border-slate-100 dark:border-white/[0.08] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('nav.language')}</p>
                    </div>
                    {[
                      { code: 'en' as const, label: 'English' },
                      { code: 'ur' as const, label: 'اردو' },
                    ].map((option) => (
                      <button
                        key={option.code}
                        onClick={() => { setLang(option.code); setShowLangDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors ${
                          lang === option.code
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        {lang === option.code && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b1120]" />
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-[340px] bg-white dark:bg-[var(--card-bg)] border border-slate-100 dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t('nav.notifications')}</h3>
                        {unreadCount > 0 && (
                          <p className="text-xs text-slate-400">{unreadCount} {t('common.unread')}</p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                        >
                          <CheckCheck size={12} />
                          {t('nav.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={32} className="text-slate-300 dark:text-slate-600 mb-2 mx-auto" />
                          <p className="text-sm text-slate-400">You're all caught up!</p>
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
                            className={`px-4 py-3 border-b border-slate-50 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer relative ${
                              !notif.is_read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-0.5">
                              <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
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
                className="flex items-center gap-2.5 pl-2.5 border-l border-slate-100 dark:border-white/[0.08] hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-right min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
                {user.avatar && !avatarBroken ? (
                  <img
                    src={getFileUrl(user.avatar)}
                    alt={user.full_name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
                    onError={() => setAvatarBroken(true)}
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
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-blue-500" />
                )}
              </button>
              {/* Language picker (guest) */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  <Globe size={14} />
                  <span>{lang === 'en' ? 'EN' : 'اردو'}</span>
                </button>
                {showLangDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-[var(--card-bg)] border border-slate-100 dark:border-white/[0.08] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('nav.language')}</p>
                    </div>
                    {[
                      { code: 'en' as const, label: 'English' },
                      { code: 'ur' as const, label: 'اردو' },
                    ].map((option) => (
                      <button
                        key={option.code}
                        onClick={() => { setLang(option.code); setShowLangDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors ${
                          lang === option.code
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        {lang === option.code && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                {t('nav.signup')}
              </Link>
            </div>
          )}
        </div>
        </div>
      </header>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[var(--card-bg)] border border-slate-100 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl shrink-0 mt-0.5">
                <Bell size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white text-base leading-tight">
                  {selectedNotification.title}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-100 dark:border-white/[0.04] mb-4">
              {selectedNotification.message}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
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
