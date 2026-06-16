'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../utils/api';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Hourglass,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';

interface Bid {
  id: number;
  job_id: number;
  job_title?: string;
  job_location?: string;
  job_status?: string;
  category_name?: string;
  amount: number;
  estimated_time: string;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  customer_id?: number;
  client_id?: number;
}

type TabKey = 'all' | 'pending' | 'active' | 'completed' | 'availed';

export default function ProviderBidsPage() {
  const { user, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const router = useRouter();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMyBids = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/bids/my/bids');
      setBids(Array.isArray(data) ? data : data.bids || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load bid history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'provider') {
      router.push('/login');
      return;
    }
    fetchMyBids();
  }, [user, authLoading, router, fetchMyBids]);

  const getJobStatus = (bid: Bid) => (bid.job_status || 'open').toString().toLowerCase();

  const handleMarkAsDone = async (bid: Bid) => {
    if (!confirm('Mark this job as done? The client will be asked to confirm completion.')) return;
    setActionLoading(bid.job_id);
    setError(null);
    try {
      await api.put(`/bookings/job/${bid.job_id}/status`, { status: 'awaiting_confirmation' });
      setSuccessMsg('Job marked as done! Waiting for customer confirmation.');
      await fetchMyBids();
    } catch (err: any) {
      setError(err.message || 'Failed to update job status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filterBids = (tab: TabKey): Bid[] => {
    if (tab === 'all') return bids;
    if (tab === 'pending') return bids.filter(b => b.status === 'pending' && getJobStatus(b) === 'open');
    if (tab === 'active') return bids.filter(b => b.status === 'accepted' && (getJobStatus(b) === 'active' || getJobStatus(b) === 'awaiting_confirmation'));
    if (tab === 'completed') return bids.filter(b => b.status === 'accepted' && getJobStatus(b) === 'completed');
    if (tab === 'availed') return bids.filter(b => b.status !== 'accepted' && (getJobStatus(b) === 'active' || getJobStatus(b) === 'completed'));
    return bids;
  };

  const countTab = (tab: TabKey) => filterBids(tab).length;

  const getStatusBadge = (bid: Bid) => {
    const jobStatus = getJobStatus(bid);
    if (bid.status === 'accepted') {
      if (jobStatus === 'completed') return { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' };
      if (jobStatus === 'awaiting_confirmation') return { label: 'Awaiting Confirmation', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' };
      return { label: 'Active', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' };
    }
    if (jobStatus === 'active' || jobStatus === 'completed') return { label: 'Service Availed', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400' };
    if (bid.status === 'rejected') return { label: 'Rejected', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' };
    return { label: 'Pending', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' };
  };

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'availed', label: 'Availed' },
  ];

  const displayedBids = filterBids(activeTab);

  return (
    <div className="flex-grow max-w-57xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Placed Bids
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor your quotes, active jobs, and completed work.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-start gap-2">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
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
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${activeTab === tab.key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500'
              }`}>
              {countTab(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {displayedBids.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <Briefcase size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No bids found in this category.</p>
          <Link href="/provider/browse-jobs" className="inline-block mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Find jobs →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBids.map((bid) => {
            const badge = getStatusBadge(bid);
            const jobStatus = getJobStatus(bid);
            const isActiveJob = bid.status === 'accepted' && jobStatus === 'active';
            const isAwaiting = bid.status === 'accepted' && jobStatus === 'awaiting_confirmation';
            const customerId = bid.customer_id || bid.client_id;

            return (
              <div
                key={bid.id}
                className={`bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border shadow-sm flex flex-col gap-4 ${isActiveJob ? 'border-blue-200/60 dark:border-blue-800/50' :
                    isAwaiting ? 'border-amber-200/60 dark:border-amber-800/50' :
                      'border-zinc-200/60 dark:border-zinc-800/80'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                        {bid.job_title || `Job #${bid.job_id}`}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${badge.color}`}>
                        {badge.label}
                      </span>
                      {bid.category_name && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full">
                          {bid.category_name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl italic">
                      "{bid.cover_letter}"
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 pt-0.5">
                      {bid.job_location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {bid.job_location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                        <DollarSign size={11} />
                        {format(bid.amount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Est: {bid.estimated_time}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        Submitted: {bid.created_at?.split('T')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {(isActiveJob || isAwaiting || (bid.status === 'accepted' && customerId)) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {customerId && (
                      <Link
                        href={`/chat?jobId=${bid.job_id}&userId=${customerId}`}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
                      >
                        <MessageSquare size={13} />
                        Chat Client
                      </Link>
                    )}

                    {isActiveJob && (
                      <button
                        onClick={() => handleMarkAsDone(bid)}
                        disabled={actionLoading === bid.job_id}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow transition-all"
                      >
                        <CheckCheck size={13} />
                        {actionLoading === bid.job_id ? 'Updating...' : 'Mark Job as Done'}
                      </button>
                    )}

                    {isAwaiting && (
                      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/50">
                        <Hourglass size={13} />
                        Waiting for Client Confirmation
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
