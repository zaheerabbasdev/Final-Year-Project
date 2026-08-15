'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api, getFileUrl } from '../../utils/api';
import { Star, CheckCircle2, AlertCircle, ChevronLeft, Send } from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

function SubmitReviewContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = searchParams.get('bookingId');
  const jobId = searchParams.get('jobId');
  const providerId = searchParams.get('providerId');
  const providerName = searchParams.get('providerName') || 'Provider';
  const providerAvatar = searchParams.get('providerAvatar');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }
    if (!bookingId || !jobId || !providerId) {
      router.push('/customer/dashboard');
    }
  }, [user, authLoading, router, bookingId, jobId, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating before submitting.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await api.post('/reviews', {
        booking_id: parseInt(bookingId!),
        job_id: parseInt(jobId!),
        provider_id: parseInt(providerId!),
        rating,
        comment: comment.trim(),
      });
      setSuccess(true);
      setTimeout(() => router.push('/customer/dashboard'), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Review Submitted!</h2>
          <p className="text-sm text-zinc-500">Thank you for your feedback. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
        {/* Provider Info */}
        <div className="text-center mb-8">
          {providerAvatar ? (
            <img
              src={getFileUrl(providerAvatar)}
              alt={providerName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md mx-auto mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/40 flex items-center justify-center text-3xl font-extrabold text-blue-600 dark:text-blue-400 border-4 border-white dark:border-zinc-900 shadow-md mx-auto mb-4">
              {providerName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">How was your experience with</p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{providerName}</h1>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Your Rating</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={44}
                    className={`transition-colors ${star <= activeRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                  />
                </button>
              ))}
            </div>
            <p className={`text-base font-bold transition-colors ${rating > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`}>
              {activeRating > 0 ? RATING_LABELS[activeRating] : 'Tap stars to rate'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
              Share your experience (Optional)
            </label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the quality of service, punctuality, professionalism..."
              className="block w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Send size={15} />
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SubmitReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SubmitReviewContent />
    </Suspense>
  );
}
