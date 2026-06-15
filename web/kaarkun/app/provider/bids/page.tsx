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
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface Bid {
  id: number;
  job_id: number;
  job_title?: string;
  job_location?: string;
  amount: number;
  estimated_time: string;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function ProviderBidsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'provider') {
      router.push('/login');
      return;
    }

    const fetchMyBids = async () => {
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
    };

    fetchMyBids();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-55">
          My Placed Bids
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-45 mt-1">
          Monitor your quotes and check if customers have hired you.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-45 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">You haven't submitted any bids yet.</p>
          <Link href="/provider/browse-jobs" className="inline-block mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Find jobs &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div 
              key={bid.id} 
              className="bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                    {bid.job_title || `Job #${bid.job_id}`}
                  </h3>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                    bid.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    bid.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                    'bg-rose-100 text-rose-805 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}>
                    {bid.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-xl">
                  Proposal: <span className="italic">"{bid.cover_letter}"</span>
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 pt-1">
                  {bid.job_location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {bid.job_location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-350">
                    <DollarSign size={12} />
                    PKR {Number(bid.amount).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Est: {bid.estimated_time}
                  </span>
                </div>
              </div>

              {bid.status === 'accepted' && (
                <div className="shrink-0 flex items-center justify-end sm:border-l sm:pl-4 border-zinc-100 dark:border-zinc-800 pt-3 sm:pt-0">
                  <Link 
                    href="/provider/dashboard"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Go to Booking
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
