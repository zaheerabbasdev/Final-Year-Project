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
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  MessageSquare,
  Star,
  CheckCheck,
  XCircle,
  Layers,
  CalendarCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  bids_count?: number;
}

interface Booking {
  id: number;
  job_id: number;
  job_title?: string;
  provider_name?: string;
  provider_phone?: string;
  provider_id: number;
  status: 'confirmed' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled';
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  open:                 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  active:               'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed:            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:            'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  confirmed:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  awaiting_confirmation:'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') { router.push('/login'); return; }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsData, bookingsData] = await Promise.all([
          api.get('/jobs/my/jobs'),
          api.get('/bookings/my'),
        ]);
        setJobs(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading, router]);

  const handleConfirmCompletion = async (bookingId: number) => {
    if (!confirm('Confirm that the job has been completed?')) return;
    setConfirmLoading(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'completed' });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
    } catch (err: any) {
      setError(err.message || 'Failed to confirm completion.');
    } finally {
      setConfirmLoading(null);
    }
  };

  const handleCancelJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;
    try {
      await api.put(`/jobs/${jobId}`, { status: 'cancelled' });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'cancelled' } : j));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel job.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'active');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">

      {/* Welcome hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-7 shadow-xl shadow-indigo-500/20">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back 👋</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {user?.full_name}
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''} · {activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/customer/post-job"
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-sm font-bold shadow-lg transition-all shrink-0"
          >
            <Plus size={16} />
            Post a Job
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: jobs.length, icon: <Briefcase size={18} />, color: 'indigo' },
          { label: 'Active', value: activeJobs.length, icon: <TrendingUp size={18} />, color: 'amber' },
          { label: 'Completed', value: completedJobs.length, icon: <CheckCircle2 size={18} />, color: 'emerald' },
          { label: 'Bookings', value: bookings.length, icon: <CalendarCheck size={18} />, color: 'violet' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
              <div className={`p-2 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-500`}>
                {icon}
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* My Jobs — 2 cols */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" />
                <h2 className="font-bold text-zinc-900 dark:text-white">My Job Posts</h2>
              </div>
              <Link href="/customer/jobs" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                View all <ChevronRight size={13} />
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">No jobs posted yet</p>
                <Link href="/customer/post-job" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  <Sparkles size={14} />
                  Post your first job →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50 dark:divide-white/[0.04]">
                {jobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="px-6 py-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {job.title}
                          </h3>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[job.status] || STATUS_STYLES.cancelled}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                          <span className="flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-300">
                            <DollarSign size={11} />PKR {Number(job.budget).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1"><Clock size={11} />{new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {job.status === 'open' && (
                          <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg font-medium">
                            {job.bids_count || 0} bids
                          </span>
                        )}
                        {job.status === 'open' && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Cancel job"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        <Link
                          href={`/customer/jobs/${job.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                          Details <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col: Active bookings */}
        <div>
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-emerald-500" />
                <h2 className="font-bold text-zinc-900 dark:text-white">Active Bookings</h2>
              </div>
              <Link href="/customer/bookings" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                All <ChevronRight size={13} />
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm text-zinc-400">No bookings yet. Hired jobs will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50 dark:divide-white/[0.04]">
                {bookings.map((booking) => (
                  <div key={booking.id} className="px-5 py-4 space-y-3">
                    <div>
                      <p className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight mb-1">
                        {booking.job_title || `Booking #${booking.id}`}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[booking.status] || STATUS_STYLES.cancelled}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={11} />
                        Provider: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{booking.provider_name || 'Provider'}</span>
                      </div>
                      {booking.provider_phone && (
                        <div>📞 {booking.provider_phone}</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/chat?jobId=${booking.job_id}&userId=${booking.provider_id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"
                      >
                        <MessageSquare size={11} /> Message
                      </Link>
                      {booking.status === 'awaiting_confirmation' && (
                        <button
                          onClick={() => handleConfirmCompletion(booking.id)}
                          disabled={confirmLoading === booking.id}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                          <CheckCheck size={11} />
                          {confirmLoading === booking.id ? '...' : 'Confirm Done'}
                        </button>
                      )}
                      {booking.status === 'completed' && booking.provider_id && (
                        <Link
                          href={`/customer/submit-review?bookingId=${booking.id}&jobId=${booking.job_id}&providerId=${booking.provider_id}&providerName=${encodeURIComponent(booking.provider_name || 'Provider')}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all"
                        >
                          <Star size={11} /> Review
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
