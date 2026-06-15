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
  Star, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface Booking {
  id: number;
  job_id: number;
  job_title?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id: number;
  status: 'confirmed' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled';
  created_at: string;
}

export default function ProviderDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'provider') {
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Only load bookings if verified
        if (user.status === 'verified') {
          const bookingsData = await api.get('/bookings/my');
          setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []);
        }
      } catch (err: any) {
        console.error('Error loading provider dashboard', err);
        setError(err.message || 'Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const profile = user?.profile || {};

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Verification Banner */}
      {user?.status === 'pending' && (
        <div className="mb-8 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AlertCircle size={28} className="shrink-0" />
          <div>
            <h3 className="font-bold text-base">Application Pending Approval</h3>
            <p className="text-sm mt-0.5 font-light">
              Your profile is currently being reviewed by the administration. You will receive access to bid on jobs once verified.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Overview */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img 
              src={`http://localhost:5000${user.avatar}`} 
              alt={user.full_name} 
              className="w-20 h-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{user?.full_name}</h1>
              {user?.status === 'verified' && (
                <span className="p-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full" title="Verified Provider">
                  <UserCheck size={16} />
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 capitalize">{user?.role} Profile</p>
            <p className="text-xs text-zinc-400 mt-1">Experience: {profile.experience_years || 0} years</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-250/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase">Average Rating</p>
            <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              {parseFloat(profile.rating || 0).toFixed(1)}
              <Star size={18} fill="currentColor" className="text-amber-500" />
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Star size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-250/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase">Jobs Completed</p>
            <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">
              {profile.total_jobs || 0}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-250/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase">Success Rate</p>
            <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">
              {parseFloat(profile.success_rate || 0).toFixed(0)}%
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-250/60 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase">Profile Status</p>
            <p className="text-lg font-bold mt-1 text-zinc-900 dark:text-zinc-50 capitalize">
              {user?.status}
            </p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 rounded-xl">
            <UserCheck size={20} />
          </div>
        </div>
      </div>

      {/* Bookings & Active Work */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Bookings */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-indigo-650 dark:text-indigo-400" />
            My Active Bookings
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
              {user?.status === 'pending' 
                ? 'Your account is pending verification. Hired jobs will display here.' 
                : 'No active tasks at the moment. Browse jobs and start bidding!'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/20"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {booking.job_title || `Booking #${booking.id}`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        Client: <strong>{booking.customer_name || 'Client'}</strong>
                      </span>
                      {booking.customer_phone && (
                        <span>Phone: <strong>{booking.customer_phone}</strong></span>
                      )}
                      <span className="flex items-center gap-1 font-semibold capitalize text-indigo-600">
                        Status: {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link 
                      href={`/chat?jobId=${booking.job_id}&userId=${booking.customer_id}`} 
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <MessageSquare size={12} />
                      Chat Client
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Actions Quick Links */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {user?.status === 'verified' ? (
                <Link 
                  href="/provider/browse-jobs" 
                  className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Browse Available Jobs
                </Link>
              ) : (
                <button 
                  disabled 
                  className="block w-full text-center py-2.5 bg-zinc-250 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 text-sm font-semibold rounded-xl cursor-not-allowed"
                >
                  Browse Jobs (Pending Verification)
                </button>
              )}
              <Link 
                href="/provider/bids" 
                className="block w-full text-center py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-sm font-semibold rounded-xl transition-all"
              >
                View My Bid History
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
