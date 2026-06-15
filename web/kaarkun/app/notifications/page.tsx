'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  BellOff,
  Info,
  Briefcase,
  MessageSquare,
  Star,
  Zap
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

const getNotifIcon = (type?: string) => {
  switch (type) {
    case 'bid': return <Briefcase size={18} className="text-indigo-500" />;
    case 'message': return <MessageSquare size={18} className="text-blue-500" />;
    case 'review': return <Star size={18} className="text-amber-500" />;
    case 'emergency': return <Zap size={18} className="text-rose-500" />;
    default: return <Info size={18} className="text-zinc-400" />;
  }
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchNotifications();
  }, [user?.id, authLoading, router, fetchNotifications]);

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err: any) {
      setError(err.message || 'Failed to mark as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOneRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-xl">
              <Bell size={22} className="text-orange-500" />
            </span>
            Notifications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 ml-12">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all disabled:opacity-50"
          >
            <CheckCheck size={14} />
            Mark All Read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <BellOff size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No notifications yet</p>
          <p className="text-xs text-zinc-400 mt-1">Activity alerts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && handleMarkOneRead(notif.id)}
              className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.is_read
                  ? 'bg-white dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  : 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20'
              }`}
            >
              {/* Icon */}
              <div className={`shrink-0 p-2 rounded-xl mt-0.5 ${
                notif.is_read
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'bg-white dark:bg-zinc-900 shadow-sm border border-indigo-100 dark:border-indigo-900/50'
              }`}>
                {getNotifIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm leading-snug ${notif.is_read ? 'font-medium text-zinc-700 dark:text-zinc-300' : 'font-bold text-zinc-900 dark:text-zinc-50'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 shrink-0 mt-0.5">{timeAgo(notif.created_at)}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{notif.message}</p>
              </div>

              {/* Unread dot */}
              {!notif.is_read && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
