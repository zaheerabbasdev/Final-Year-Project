'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  Bell,
  LogOut,
  Menu
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

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

  const toggleSidebar = () => {
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  // Helper to generate the page title based on the route
  const getPageTitle = () => {
    if (pathname.includes('/dashboard')) return 'Management Console';
    if (pathname.includes('/post-job')) return 'Post a Job';
    if (pathname.includes('/browse-jobs')) return 'Browse Jobs Feed';
    if (pathname.includes('/bids')) return 'My Proposals & Bids';
    if (pathname.includes('/chat')) return 'Messages Hub';
    return '';
  };

  const getPageSubtitle = () => {
    if (!user) return '';
    return user.role === 'customer' ? 'CUSTOMER PORTAL' : 'PROVIDER PORTAL';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="px-6 h-24 flex items-center justify-between">

        {/* Left Side: Page Title */}
        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 -ml-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:outline-none"
            >
              <Menu size={24} />
            </button>
          )}

          {!user && (
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Kaarkun
              </span>
            </Link>
          )}

          {user && (
            <div className="hidden sm:block">
              <p className="text-[10px] tracking-widest font-bold text-zinc-400 uppercase mb-0.5">
                {getPageSubtitle()}
              </p>
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          )}
        </div>

        {/* Right Action Items */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4 relative">

              {/* Fake Live Badge like in the image */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full border border-blue-100 dark:border-blue-800/50">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Live
              </div>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-orange-500 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-full transition-colors relative shadow-sm border border-orange-100 dark:border-orange-900/50"
              >
                <Bell size={18} className="fill-orange-500/20" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-950"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-sm">No notifications yet.</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${!notif.is_read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.full_name}</span>
                  <span className="text-[10px] text-zinc-500">{user.email || 'customer@gmail.com'}</span>
                </div>
                {user.avatar ? (
                  <img
                    src={`http://localhost:5000${user.avatar}`}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shadow-sm border border-blue-200 dark:border-blue-800/50">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/login" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all">
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
