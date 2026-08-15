'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import { ChevronLeft, Star, AlertCircle, MessageSquareOff } from 'lucide-react';
import { FullPageSpinner } from '../../components/ui';

interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

export default function ProviderAllReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'provider') { router.push('/login'); return; }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/reviews/provider/${user.id}`);
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <FullPageSpinner />
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft size={18} />
        {t('provider.reviews.backToProfile')}
      </button>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t('provider.reviews.title')}
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            {t('provider.reviews.subtitle')}
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-center">
                {avgRating} <Star size={15} className="fill-amber-500 text-amber-500" />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">{t('provider.reviews.average')}</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">{reviews.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">{t('provider.reviews.totalReviews')}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <MessageSquareOff size={28} className="text-zinc-400 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t('provider.reviews.noReviews')}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">{t('provider.reviews.noReviewsSubtitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((r) => {
            const tier = r.rating >= 4.5 ? 'emerald' : r.rating >= 3.5 ? 'blue' : r.rating >= 2.5 ? 'amber' : 'rose';
            return (
              <div
                key={r.id}
                className="stat-card relative overflow-hidden flex flex-col gap-3 p-4 rounded-xl border border-zinc-100 dark:border-white/[0.06] bg-white dark:bg-zinc-900/40 hover:shadow-md transition-all"
              >
                <div className={`absolute top-0 left-0 h-1 w-full bg-${tier}-400`} />

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {r.customer_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">{r.customer_name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-${tier}-100 text-${tier}-700 dark:bg-${tier}-950/40 dark:text-${tier}-400`}>
                        <Star size={11} fill="currentColor" />
                        {r.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 italic font-light leading-relaxed bg-zinc-50/60 dark:bg-white/[0.02] p-3 rounded-lg border border-zinc-100 dark:border-white/[0.04]">
                  "{r.comment}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
