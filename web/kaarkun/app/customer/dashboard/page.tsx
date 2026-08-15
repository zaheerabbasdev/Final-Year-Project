'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import {
  Briefcase,
  MapPin,
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
  Zap,
  ClipboardList,
  LayoutDashboard,
  Phone,
} from 'lucide-react';
import { CountUp, FullPageSpinner, EmptyState } from '../../components/ui';

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
  open:                 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active:               'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed:            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  confirmed:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  awaiting_confirmation:'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

const STATUS_ACCENT: Record<string, string> = {
  open:                 'bg-blue-400',
  active:               'bg-amber-400',
  completed:            'bg-emerald-400',
  cancelled:            'bg-slate-300 dark:bg-slate-700',
  confirmed:            'bg-blue-400',
  in_progress:          'bg-amber-400',
  awaiting_confirmation:'bg-sky-400',
};

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const { t } = useLanguage();
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
    return <FullPageSpinner />;
  }

  const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'active');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">

      {/* Page title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
          <LayoutDashboard size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{t('sidebar.dashboard')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('customer.dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Welcome hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-7 shadow-xl shadow-blue-500/20">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 right-24 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">{t('customer.dashboard.greeting')}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {user?.full_name}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''} · {activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/customer/post-job"
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-lg transition-all shrink-0"
          >
            <Plus size={16} />
            {t('customer.dashboard.postJob')}
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
          { label: t('customer.dashboard.totalJobs'),          value: jobs.length,          icon: <Briefcase size={18} />,    iconCls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
          { label: t('customer.dashboard.status.active'),      value: activeJobs.length,    icon: <TrendingUp size={18} />,   iconCls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
          { label: t('customer.dashboard.status.completed'),   value: completedJobs.length, icon: <CheckCircle2 size={18} />, iconCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' },
          { label: t('customer.dashboard.activeBookingsStat'), value: bookings.length,      icon: <CalendarCheck size={18} />,iconCls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-500' },
        ].map(({ label, value, icon, iconCls }) => (
          <div key={label} className="stat-card glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <div className={`p-2 rounded-xl ${iconCls}`}>{icon}</div>
            </div>
            <CountUp target={value} className="text-2xl font-black text-slate-900 dark:text-white tabular-nums" />
          </div>
        ))}
      </div>

      {/* My Job Posts */}
      <div className="mb-6">
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">{t('customer.dashboard.recentJobs')}</h2>
            </div>
            <Link href="/customer/jobs" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              {t('customer.dashboard.viewAllJobs')} <ChevronRight size={13} />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <ClipboardList size={40} className="text-slate-300 dark:text-slate-600 mb-3 mx-auto" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('customer.dashboard.noJobs')}</p>
              <Link href="/customer/post-job" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                <Zap size={14} />
                {t('customer.jobs.postFirst')} →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {jobs.slice(0, 6).map((job) => (
                <div
                  key={job.id}
                  className="stat-card relative overflow-hidden rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-4 group"
                >
                  <div className={`absolute top-0 left-0 h-1 w-full ${STATUS_ACCENT[job.status] || STATUS_ACCENT.cancelled}`} />

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {job.title}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[job.status] || STATUS_STYLES.cancelled}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {format(job.budget)}
                    </span>
                    {job.status === 'open' ? (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                        {job.bids_count || 0} bid{job.bids_count === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} />{new Date(job.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/customer/jobs/${job.id}`}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      {t('customer.dashboard.details')} <ChevronRight size={13} />
                    </Link>
                    {job.status === 'open' && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 shrink-0"
                        title="Cancel job"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Bookings */}
      <div>
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-emerald-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">{t('customer.dashboard.activeBookings')}</h2>
            </div>
            <Link href="/customer/bookings" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              {t('customer.dashboard.viewAllBookings')} <ChevronRight size={13} />
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CalendarCheck size={40} className="text-slate-300 dark:text-slate-600 mb-3 mx-auto" />
              <p className="text-sm text-slate-400">{t('customer.dashboard.noBookings')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="stat-card relative overflow-hidden rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-4 group"
                >
                  <div className={`absolute top-0 left-0 h-1 w-full ${STATUS_ACCENT[booking.status] || STATUS_ACCENT.cancelled}`} />

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(booking.provider_name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {booking.job_title || `Booking #${booking.id}`}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 truncate">
                        <UserIcon size={11} className="shrink-0" />
                        {booking.provider_name || 'Provider'}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[booking.status] || STATUS_STYLES.cancelled}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-400">
                    {booking.provider_phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="shrink-0" />{booking.provider_phone}
                      </span>
                    ) : <span />}
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/chat?jobId=${booking.job_id}&userId=${booking.provider_id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                    >
                      <MessageSquare size={11} /> {t('customer.bookings.chat')}
                    </Link>
                    {booking.status === 'awaiting_confirmation' && (
                      <button
                        onClick={() => handleConfirmCompletion(booking.id)}
                        disabled={confirmLoading === booking.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-50"
                      >
                        <CheckCheck size={11} />
                        {confirmLoading === booking.id ? '...' : 'Confirm Done'}
                      </button>
                    )}
                    {booking.status === 'completed' && booking.provider_id && (
                      <Link
                        href={`/customer/submit-review?bookingId=${booking.id}&jobId=${booking.job_id}&providerId=${booking.provider_id}&providerName=${encodeURIComponent(booking.provider_name || 'Provider')}`}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all"
                      >
                        <Star size={11} /> {t('customer.bookings.review')}
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
  );
}
