'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
  Plus,
  CheckCheck,
  Star,
  XCircle,
  Navigation,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Users,
  ClipboardList,
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: 'open' | 'active' | 'completed' | 'cancelled' | 'awaiting_confirmation';
  is_emergency: boolean;
  is_negotiable: boolean;
  created_at: string;
  category_name?: string;
  booking_status?: string;
  booking_id?: number;
  provider_id?: number;
  provider_name?: string;
  provider_avatar?: string;
  review_id?: number;
}

type TabKey = 'all' | 'open' | 'active' | 'completed' | 'cancelled';

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
  active: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  awaiting_confirmation: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400',
};

const STATUS_ACCENT: Record<string, string> = {
  open: 'bg-blue-400',
  active: 'bg-amber-400',
  awaiting_confirmation: 'bg-violet-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-300',
};

export default function CustomerJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const { t } = useLanguage();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/jobs/my/jobs');
      setJobs(Array.isArray(data) ? data : data.jobs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }
    fetchJobs();
  }, [user?.id, authLoading, router, fetchJobs]);

  const handleCancelJob = async (jobId: number) => {
    if (!confirm('Cancel this job? This cannot be undone.')) return;
    setActionLoading(jobId);
    try {
      await api.put(`/jobs/${jobId}`, { status: 'cancelled' });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'cancelled' } : j));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel job.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCompletion = async (job: Job) => {
    if (!confirm('Confirm this job has been completed?')) return;
    setActionLoading(job.id);
    try {
      if (job.booking_id) {
        await api.put(`/bookings/${job.booking_id}/status`, { status: 'completed' });
      } else {
        await api.put(`/bookings/job/${job.id}/status`, { status: 'completed' });
      }
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, booking_status: 'completed', status: 'completed' } : j));
    } catch (err: any) {
      setError(err.message || 'Failed to confirm completion.');
    } finally {
      setActionLoading(null);
    }
  };

  const filterJobs = (tab: TabKey): Job[] => {
    if (tab === 'all') return jobs;
    if (tab === 'active') return jobs.filter(j => j.status === 'active' || j.status === 'awaiting_confirmation' as any);
    return jobs.filter(j => j.status === tab);
  };

  const countTab = (tab: TabKey) => filterJobs(tab).length;

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: t('customer.jobs.tabs.all') },
    { key: 'open', label: t('customer.jobs.tabs.open') },
    { key: 'active', label: t('customer.jobs.tabs.active') },
    { key: 'completed', label: t('customer.jobs.tabs.completed') },
    { key: 'cancelled', label: t('customer.jobs.tabs.cancelled') },
  ];

  const displayed = filterJobs(activeTab);

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <ClipboardList size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">{t('customer.jobs.title')}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t('customer.jobs.subtitle')}</p>
          </div>
        </div>
        <Link
          href="/customer/post-job"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all"
        >
          <Plus size={14} />
          {t('customer.jobs.postNew')}
        </Link>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.key
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${activeTab === tab.key
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
              : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500'
              }`}>
              {countTab(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Job List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <Briefcase size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('customer.jobs.noJobs')}</p>
          <Link href="/customer/post-job" className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-semibold">
            {t('customer.jobs.postFirst')} →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayed.map(job => {
            const displayStatus = job.booking_status === 'awaiting_confirmation' ? 'awaiting_confirmation' : job.status;
            const badgeClass = STATUS_BADGE[displayStatus] || STATUS_BADGE['open'];
            const isActive = job.status === 'active';
            const isAwaiting = job.booking_status === 'awaiting_confirmation' || job.status === ('awaiting_confirmation' as any);
            const isCompleted = job.status === 'completed';
            const isOpen = job.status === 'open';

            return (
              <div
                key={job.id}
                className="relative overflow-hidden bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className={`absolute top-0 left-0 h-1 w-full ${STATUS_ACCENT[displayStatus] || STATUS_ACCENT.cancelled}`} />

                <div className="p-5 flex flex-col gap-4 flex-grow">
                  {/* Top Row: icon + title + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${job.is_emergency ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
                        <Wrench size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {job.is_emergency && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 rounded-full uppercase">
                              <AlertTriangle size={9} /> {t('customer.jobs.emergency')}
                            </span>
                          )}
                          {job.category_name && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
                              {job.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full uppercase ${badgeClass}`}>
                      {displayStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{job.description}</p>

                  {/* Stat pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-zinc-50 dark:bg-white/[0.03] p-2.5">
                      <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wide">{t('customer.jobs.budget')}</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5 truncate">
                        {format(job.budget)}{job.is_negotiable && <span className="text-[10px] font-normal text-zinc-400"> (Neg.)</span>}
                      </p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-white/[0.03] p-2.5">
                      <p className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase font-semibold tracking-wide"><MapPin size={10} /> {t('customer.jobs.location')}</p>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mt-0.5 truncate">{job.location}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 dark:bg-white/[0.03] p-2.5">
                      <p className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase font-semibold tracking-wide"><Clock size={10} /> {t('customer.jobs.posted')}</p>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mt-0.5 truncate">{job.created_at?.split('T')[0]}</p>
                    </div>
                  </div>

                  {job.provider_name && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <Users size={12} className="shrink-0" />
                      {t('customer.jobs.providerLabel')}: <strong className="text-zinc-700 dark:text-zinc-200">{job.provider_name}</strong>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/[0.02]">
                  <Link
                    href={`/customer/jobs/${job.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 rounded-xl transition-all"
                  >
                    <ChevronRight size={12} /> {t('customer.jobs.viewBids')}
                  </Link>

                  {isActive && job.provider_id && (
                    <Link
                      href={`/chat?jobId=${job.id}&userId=${job.provider_id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 text-xs font-semibold rounded-xl transition-all hover:bg-indigo-100 dark:hover:bg-indigo-950/50"
                    >
                      <Navigation size={12} /> Message Provider
                    </Link>
                  )}

                  {isAwaiting && (
                    <button
                      onClick={() => handleConfirmCompletion(job)}
                      disabled={actionLoading === job.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow"
                    >
                      <CheckCheck size={12} />
                      {actionLoading === job.id ? t('customer.jobs.confirming') : t('customer.jobs.confirmCompletion')}
                    </button>
                  )}

                  {isCompleted && !job.review_id && job.provider_id && (
                    <Link
                      href={`/customer/submit-review?bookingId=${job.booking_id}&jobId=${job.id}&providerId=${job.provider_id}&providerName=${encodeURIComponent(job.provider_name || 'Provider')}&providerAvatar=${encodeURIComponent(job.provider_avatar || '')}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow"
                    >
                      <Star size={12} /> Leave Review
                    </Link>
                  )}

                  {isOpen && (
                    <button
                      onClick={() => handleCancelJob(job.id)}
                      disabled={actionLoading === job.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition-all hover:bg-rose-100 dark:hover:bg-rose-950/40"
                    >
                      <XCircle size={12} />
                      {actionLoading === job.id ? t('customer.jobs.cancelling') : t('customer.jobs.cancelJob')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
