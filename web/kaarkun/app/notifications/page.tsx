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
  Zap,
  X
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

const NOTIF_STYLE: Record<string, { icon: React.ReactNode; chip: string; accent: string }> = {
  bid:       { icon: <Briefcase size={18} className="text-indigo-500" />, chip: 'bg-indigo-100 dark:bg-indigo-950/40', accent: 'bg-indigo-400' },
  message:   { icon: <MessageSquare size={18} className="text-blue-500" />, chip: 'bg-blue-100 dark:bg-blue-950/40', accent: 'bg-blue-400' },
  review:    { icon: <Star size={18} className="text-amber-500" />, chip: 'bg-amber-100 dark:bg-amber-950/40', accent: 'bg-amber-400' },
  emergency: { icon: <Zap size={18} className="text-rose-500" />, chip: 'bg-rose-100 dark:bg-rose-950/40', accent: 'bg-rose-400' },
  booking:   { icon: <CheckCheck size={18} className="text-emerald-500" />, chip: 'bg-emerald-100 dark:bg-emerald-950/40', accent: 'bg-emerald-400' },
  default:   { icon: <Info size={18} className="text-zinc-400" />, chip: 'bg-zinc-100 dark:bg-zinc-800', accent: 'bg-zinc-300 dark:bg-zinc-700' },
};

const getNotifStyle = (type?: string) => {
  if (!type) return NOTIF_STYLE.default;
  if (type.includes('booking') || type.includes('handshake') || type.includes('suspend')) return NOTIF_STYLE.booking;
  return NOTIF_STYLE[type] || NOTIF_STYLE.default;
};

const getNotifIcon = (type?: string) => getNotifStyle(type).icon;

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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
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
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="space-y-3">
          {notifications.map(notif => {
            const style = getNotifStyle(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) {
                    handleMarkOneRead(notif.id);
                  }
                  setSelectedNotification(notif);
                }}
                className={`group relative overflow-hidden flex items-start gap-4 p-4 pl-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${notif.is_read
                    ? 'bg-white dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    : 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20'
                  }`}
              >
                <div className={`absolute top-0 left-0 h-full w-1.5 ${style.accent}`} />

                {/* Icon */}
                <div className={`shrink-0 p-2.5 rounded-xl mt-0.5 ${style.chip}`}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className="grow min-w-0">
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
            );
          })}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#13131e] border border-zinc-100 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${getNotifStyle(selectedNotification.type).chip}`}>
                {getNotifIcon(selectedNotification.type)}
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
    </div>
  );
}
