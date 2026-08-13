'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { api } from '../../../utils/api';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  User as UserIcon,
  Star,
  Check,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { getFileUrl } from '../../../utils/api';

interface Bid {
  id: number;
  job_id: number;
  provider_id: number;
  provider_name?: string;
  provider_rating?: number;
  provider_avatar?: string;
  amount: number;
  estimated_time: string;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Job {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  category_id: number;
  budget: number;
  location: string;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  images?: any;
  created_at: string;
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  
  const { user, loading: authLoading } = useAuth();
  const { format } = useCurrency();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }

    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const jobData = await api.get(`/jobs/${jobId}`);
        setJob(jobData);

        const bidsData = await api.get(`/bids/job/${jobId}`);
        // If API returns wrap object, parse it
        setBids(Array.isArray(bidsData) ? bidsData : bidsData.bids || []);
      } catch (err: any) {
        console.error('Error fetching job details/bids', err);
        setError(err.message || 'Failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, user, authLoading, router]);

  const handleAcceptBid = async (bidId: number) => {
    if (!confirm('Are you sure you want to accept this bid and hire this provider?')) return;
    
    setActionLoading(true);
    setError(null);
    try {
      await api.put(`/bids/${bidId}/accept`);
      // Reload page or redirect to dashboard
      router.push('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to accept bid.');
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-grow max-w-7xl mx-auto px-4 py-8 text-center text-zinc-500">
        Job not found.
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{job.title}</h1>
                <span className={`mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                  job.status === 'open' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                  job.status === 'active' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                  'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Budget</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{format(job.budget)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Description</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-850">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <MapPin size={16} />
                  <span>Location: <strong>{job.location}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock size={16} />
                  <span>Posted on: <strong>{new Date(job.created_at).toLocaleDateString()}</strong></span>
                </div>
              </div>

              {job.images && (() => {
                // images may be a JSON array string, a comma list, or already an array
                let imgs: string[] = [];
                if (Array.isArray(job.images)) {
                  imgs = job.images;
                } else if (typeof job.images === 'string') {
                  try { imgs = JSON.parse(job.images); } catch {
                    imgs = job.images.split(',').map((s: string) => s.trim()).filter(Boolean);
                  }
                }
                if (imgs.length === 0) return null;
                return (
                  <div className="pt-4">
                    <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Attached Images</h3>
                    <div className="flex flex-wrap gap-3">
                      {imgs.map((url, idx) => (
                        <a
                          key={idx}
                          href={getFileUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-28 h-28 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={getFileUrl(url)}
                            alt={`Job image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Bids List */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
              Bids Received ({bids.length})
            </h2>

            {bids.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
                No bids submitted yet for this job.
              </div>
            ) : (
              <div className="space-y-6">
                {bids.map((bid) => (
                  <div 
                    key={bid.id} 
                    className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/20 hover:border-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
                          {bid.provider_name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">{bid.provider_name || 'Provider'}</h4>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-0.5">
                            <Star size={12} fill="currentColor" />
                            <span>{bid.provider_rating || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{format(bid.amount)}</p>
                        <p className="text-[10px] text-zinc-500">Est: {bid.estimated_time}</p>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850">
                      <p className="italic font-light">"{bid.cover_letter}"</p>
                    </div>

                    {job.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptBid(bid.id)}
                          disabled={actionLoading}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          <Check size={14} />
                          Accept & Hire
                        </button>
                        <Link 
                          href={`/chat?jobId=${job.id}&userId=${bid.provider_id}`} 
                          className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          <MessageSquare size={14} />
                          Chat
                        </Link>
                      </div>
                    )}
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
