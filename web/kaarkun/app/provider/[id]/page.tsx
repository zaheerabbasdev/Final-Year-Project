'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../utils/api';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  Briefcase,
  Layers,
  Award,
  Calendar,
  ChevronLeft
} from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

export default function ProviderPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const providerId = resolvedParams.id;
  const router = useRouter();

  const [provider, setProvider] = useState<any | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch provider user details
        const userData = await api.get(`/users/${providerId}`);
        if (!userData || userData.role !== 'provider') {
          setError('Provider not found or user is not a service provider.');
          return;
        }
        setProvider(userData);

        // Fetch reviews
        try {
          const reviewsData = await api.get(`/reviews/provider/${providerId}`);
          setReviews(Array.isArray(reviewsData) ? reviewsData : reviewsData.reviews || []);
        } catch (err) {
          console.error('Failed to load provider reviews', err);
        }
      } catch (err: any) {
        console.error('Error fetching provider details', err);
        setError(err.message || 'Failed to load provider details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex-grow max-w-7xl mx-auto px-4 py-12 text-center text-zinc-500 space-y-4">
        <p className="text-lg font-semibold text-rose-500">{error || 'Provider not found.'}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow"
        >
          <ChevronLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  const profile = provider.profile || {};
  const skillsList = Array.isArray(profile.skills) 
    ? profile.skills 
    : (profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : []);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '5.0';

  return (
    <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="relative w-32 h-32 mx-auto mt-4">
              {provider.avatar ? (
                <img
                  src={`http://localhost:5000${provider.avatar}`}
                  alt={provider.full_name}
                  className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 shadow-md">
                  {provider.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-4 leading-tight">
              {provider.full_name}
            </h2>
            <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mt-1">
              {profile.category_name || 'Verified Provider'}
            </p>

            <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {profile.is_online ? 'Available Now' : 'Offline'}
            </div>

            {/* Rating Box */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500/20 mx-auto mb-1.5" />
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{avgRating}</span>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Rating</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                <Award className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{profile.experience_years || 0}</span>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Years Exp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info: Detail and Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              Provider Profile
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Contact Phone</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                    <Phone size={14} className="text-zinc-400" />
                    {provider.phone || 'Contact locked'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Service Location</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                    <MapPin size={14} className="text-zinc-400" />
                    {provider.location || 'Not provided'}
                  </p>
                </div>
              </div>

              {skillsList.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Specialized Skills</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillsList.map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.bio && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Biography / Work Style</span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 whitespace-pre-wrap leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Customer Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                No reviews left by clients yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-950/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{r.customer_name}</h4>
                        <span className="text-[10px] text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star size={12} fill="currentColor" />
                        <span>{r.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 italic font-light">
                      "{r.comment}"
                    </p>
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
