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
  AlertCircle 
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
    <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">My Bookings</h1>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <Briefcase size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">You have no bookings at the moment.</p>
          <Link href="/customer/browse-jobs" className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Browse Jobs →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border shadow-sm flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{booking.job_title || `Booking #${booking.id}`}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                  booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                  booking.status === 'in_progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                  booking.status === 'awaiting_confirmation' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400' :
                  booking.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  booking.status === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' :
                  'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                }`}> {booking.status.replace('_', ' ')} </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-1">
                {booking.provider_name && (
                  <p className="flex items-center gap-1">
                    Provider: <strong>{booking.provider_name}</strong>
                  </p>
                )}
                {booking.provider_phone && (
                  <p className="flex items-center gap-1">
                    Phone: <strong>{booking.provider_phone}</strong>
                  </p>
                )}
                <p className="flex items-center gap-1">
                  Created: <strong>{booking.created_at.split('T')[0]}</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href={`/chat?jobId=${booking.job_id}&userId=${booking.provider_id}`}
                  className="flex-1 text-center py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center justify-center gap-1"
                >
                  <MessageSquare size={12} />
                  Message Provider
                </Link>

                {booking.status === 'awaiting_confirmation' && (
                  <button
                    onClick={() => handleConfirm(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <CheckCheck size={12} />
                    {actionLoading === booking.id ? 'Confirming...' : 'Confirm Completion'}
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <XCircle size={12} />
                    {actionLoading === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
