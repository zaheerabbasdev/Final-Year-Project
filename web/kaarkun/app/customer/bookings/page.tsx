'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Star,
  CheckCheck,
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface Booking {
  id: number;
  job_id: number;
  job_title?: string;
  job_location?: string;
  provider_id?: number;
  provider_name?: string;
  provider_phone?: string;
  status: 'confirmed' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled';
  created_at: string;
}

export default function CustomerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pinInputs, setPinInputs] = useState<Record<number, string>>({});
  const [verifyingPin, setVerifyingPin] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await api.get('/bookings/my');
        setBookings(Array.isArray(data) ? data : data.bookings || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load your bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, authLoading, router]);

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Cancel this booking? This action cannot be undone.')) return;
    setActionLoading(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyPin = async (bookingId: number) => {
    const token = (pinInputs[bookingId] || '').trim();
    if (!token) return;
    setVerifyingPin(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/handshake/verify`, { token });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'in_progress' } : b));
      setPinInputs(prev => ({ ...prev, [bookingId]: '' }));
    } catch (err: any) {
      setError(err.message || 'Invalid or expired PIN.');
    } finally {
      setVerifyingPin(null);
    }
  };

  const handleConfirm = async (bookingId: number) => {
    if (!confirm('Mark this booking as completed?')) return;
    setActionLoading(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'completed' });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
    } catch (err: any) {
      setError(err.message || 'Failed to confirm completion.');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          My Bookings
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Track and manage your service bookings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-start gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-zinc-400 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">You have no bookings at the moment.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Your confirmed service hires will appear here</p>
          <Link href="/customer/post-job" className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all">
            <Briefcase size={14} />
            Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusConfig: Record<string, { color: string; bg: string; border: string; accent: string; icon: React.ReactNode }> = {
              confirmed: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', accent: 'bg-blue-500', icon: <CheckCircle2 size={13} /> },
              in_progress: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', accent: 'bg-amber-500', icon: <Clock size={13} /> },
              awaiting_confirmation: { color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', accent: 'bg-violet-500', icon: <Clock size={13} /> },
              completed: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', accent: 'bg-emerald-500', icon: <CheckCircle2 size={13} /> },
              cancelled: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', accent: 'bg-rose-500', icon: <XCircle size={13} /> },
            };
            const sc = statusConfig[booking.status] || statusConfig.confirmed;

            return (
              <div
                key={booking.id}
                className="group w-full bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="flex">
                  {/* Accent bar */}
                  <div className={`w-1.5 shrink-0 ${sc.accent} rounded-l-2xl`} />

                  {/* Card content */}
                  <div className="flex-1 p-5 sm:p-6">
                    {/* Top row: title + status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center shrink-0`}>
                          <Briefcase size={18} className={sc.color} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate">
                            {booking.job_title || `Booking #${booking.id}`}
                          </h3>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            Booking #{booking.id}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide ${sc.bg} ${sc.color} border ${sc.border} self-start sm:self-auto whitespace-nowrap`}>
                        {sc.icon}
                        {booking.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                      {booking.provider_name && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {booking.provider_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">Provider</p>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{booking.provider_name}</p>
                          </div>
                        </div>
                      )}

                      {booking.provider_phone && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                            <MessageSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">Phone</p>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{booking.provider_phone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">Created</p>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
                      <Link
                        href={`/chat?jobId=${booking.job_id}&userId=${booking.provider_id}`}
                        className="px-3.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg inline-flex items-center gap-1.5 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                      >
                        <MessageSquare size={12} />
                        Message Provider
                      </Link>

                      {booking.status === 'completed' && (
                        <Link
                          href={`/customer/submit-review?bookingId=${booking.id}&jobId=${booking.job_id}&providerId=${booking.provider_id}&providerName=${encodeURIComponent(booking.provider_name || '')}`}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-bold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Star size={12} />
                          Leave a Review
                        </Link>
                      )}

                      {booking.status === 'awaiting_confirmation' && (
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <CheckCheck size={12} />
                          {actionLoading === booking.id ? 'Confirming...' : 'Confirm Completion'}
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Arrival PIN"
                              value={pinInputs[booking.id] || ''}
                              onChange={(e) => setPinInputs(prev => ({ ...prev, [booking.id]: e.target.value }))}
                              className="w-28 px-3 py-1.5 text-[11px] font-bold tracking-widest rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleVerifyPin(booking.id)}
                              disabled={verifyingPin === booking.id || !(pinInputs[booking.id] || '').trim()}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <KeyRound size={12} />
                              {verifyingPin === booking.id ? 'Verifying...' : 'Verify Arrival'}
                            </button>
                          </div>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="px-3.5 py-1.5 bg-white dark:bg-zinc-950 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[11px] font-bold rounded-lg inline-flex items-center gap-1.5 transition-all"
                          >
                            <XCircle size={12} />
                            {actionLoading === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
