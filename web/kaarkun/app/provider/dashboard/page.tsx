'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api, getFileUrl } from '../../utils/api';
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
  MessageSquare,
  Search,
  Scale,
  ChevronRight,
  Sparkles,
  Activity,
  Award,
  Zap,
  KeyRound,
  LayoutDashboard,
  Phone,
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

const STATUS_STYLES: Record<string, string> = {
  confirmed:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress:           'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  awaiting_confirmation: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  completed:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:             'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const STATUS_ACCENT: Record<string, string> = {
  confirmed:             'bg-blue-400',
  in_progress:           'bg-amber-400',
  awaiting_confirmation: 'bg-violet-400',
  completed:             'bg-emerald-400',
  cancelled:             'bg-zinc-300 dark:bg-zinc-700',
};

export default function ProviderDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handshakeTokens, setHandshakeTokens] = useState<Record<number, string>>({});
  const [handshakeLoading, setHandshakeLoading] = useState<number | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => { setAvatarBroken(false); }, [user?.avatar]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'provider') { router.push('/login'); return; }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        if (user.status === 'verified') {
          const bookingsData = await api.get('/bookings/my');
          setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user, authLoading, router]);

  const handleGeneratePin = async (bookingId: number) => {
    setHandshakeLoading(bookingId);
    try {
      const data = await api.post(`/bookings/${bookingId}/handshake/generate`, {});
      setHandshakeTokens(prev => ({ ...prev, [bookingId]: data.token }));
    } catch (err: any) {
      setError(err.message || 'Failed to generate arrival PIN.');
    } finally {
      setHandshakeLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const profile = user?.profile || {};
  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const isVerified = user?.status === 'verified';
  const avatarInitial = user?.full_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">

      {/* Page title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/30">
          <LayoutDashboard size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Overview of your bookings and performance</p>
        </div>
      </div>

      {/* Verification Banner */}
      {user?.status === 'pending' && (
        <div className="mb-6 flex items-start gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-400">
          <AlertCircle size={22} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Account Pending Verification</p>
            <p className="text-sm font-light mt-0.5 opacity-80">
              Your profile is being reviewed by our team. You'll be able to bid on jobs once approved.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Hero profile card */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-700 to-blue-700 p-7 shadow-xl shadow-violet-500/20">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-36 w-52 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {user?.avatar && !avatarBroken ? (
              <img
                src={getFileUrl(user.avatar)}
                alt={user.full_name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-xl"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-black text-2xl shadow-xl">
                {avatarInitial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{user?.full_name}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                    <UserCheck size={10} /> Verified
                  </span>
                )}
              </div>
              <p className="text-violet-200 text-sm">{profile.experience_years || 0} years experience · {profile.category_name || 'Service Provider'}</p>
              <p className="text-violet-200 text-xs mt-0.5">{user?.location || 'Location not set'}</p>
            </div>
          </div>

          {/* Stats row inside hero */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-white flex items-center gap-1">
                {parseFloat(profile.rating || '0').toFixed(1)}
                <Star size={16} className="text-amber-300 fill-amber-300" />
              </p>
              <p className="text-violet-200 text-xs">Rating</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{profile.total_jobs || 0}</p>
              <p className="text-violet-200 text-xs">Jobs Done</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{parseFloat(profile.success_rate || '0').toFixed(0)}%</p>
              <p className="text-violet-200 text-xs">Success</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Tasks',  value: activeBookings.length,   icon: <Activity size={18} />,   color: 'indigo' },
          { label: 'Completed',     value: completedBookings.length, icon: <CheckCircle2 size={18}/>, color: 'emerald' },
          { label: 'Success Rate',  value: `${parseFloat(profile.success_rate || '0').toFixed(0)}%`, icon: <TrendingUp size={18} />, color: 'violet' },
          { label: 'Avg Rating',    value: `${parseFloat(profile.rating || '0').toFixed(1)} ★`,     icon: <Award size={18} />,     color: 'amber' },
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

        {/* Active bookings — 2 cols */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-violet-500" />
                <h2 className="font-bold text-zinc-900 dark:text-white">Active Bookings</h2>
              </div>
              <span className="text-xs font-semibold text-zinc-400">{activeBookings.length} active</span>
            </div>

            {bookings.length === 0 ? (
              <div className="px-6 py-14 text-center">
                {isVerified
                  ? <Search size={40} className="text-zinc-300 dark:text-zinc-600 mb-3 mx-auto" />
                  : <Clock  size={40} className="text-zinc-300 dark:text-zinc-600 mb-3 mx-auto" />
                }
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {isVerified ? 'No active tasks yet' : 'Pending verification'}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {isVerified ? 'Browse jobs and start bidding to get hired!' : 'Active bookings will appear here once verified.'}
                </p>
                {isVerified && (
                  <Link
                    href="/provider/browse-jobs"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    <Search size={14} /> Browse available jobs →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="stat-card relative overflow-hidden rounded-2xl border border-zinc-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-4 group"
                  >
                    <div className={`absolute top-0 left-0 h-1 w-full ${STATUS_ACCENT[booking.status] || STATUS_ACCENT.cancelled}`} />

                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                        {(booking.customer_name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {booking.job_title || `Booking #${booking.id}`}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          Client: <strong className="text-zinc-600 dark:text-zinc-300">{booking.customer_name || 'Client'}</strong>
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[booking.status] || STATUS_STYLES.cancelled}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/[0.06] text-[11px] text-zinc-400">
                      {booking.customer_phone ? (
                        <span className="flex items-center gap-1">
                          <Phone size={11} className="shrink-0" />{booking.customer_phone}
                        </span>
                      ) : <span />}
                      <span className="flex items-center gap-1">
                        <Clock size={11} />{new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {booking.status === 'confirmed' && handshakeTokens[booking.id] && (
                      <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <KeyRound size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">{handshakeTokens[booking.id]}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {booking.status === 'confirmed' && !handshakeTokens[booking.id] && (
                        <button
                          onClick={() => handleGeneratePin(booking.id)}
                          disabled={handshakeLoading === booking.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-all shadow-sm"
                        >
                          <KeyRound size={11} /> {handshakeLoading === booking.id ? 'Generating...' : 'Generate PIN'}
                        </button>
                      )}
                      <Link
                        href={`/chat?jobId=${booking.job_id}&userId=${booking.customer_id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all shadow-sm"
                      >
                        <MessageSquare size={11} /> Chat
                      </Link>
                    </div>
                    {booking.status === 'confirmed' && handshakeTokens[booking.id] && (
                      <p className="text-[10px] text-zinc-400 mt-2">Share this PIN with the customer on arrival.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions — right col */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles size={17} className="text-violet-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {isVerified ? (
                <Link
                  href="/provider/browse-jobs"
                  className="stat-card col-span-2 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Search size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">Browse Jobs</p>
                    <p className="text-[11px] text-violet-200">Find new work nearby</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0" />
                </Link>
              ) : (
                <div className="col-span-2 flex items-center gap-3 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <Search size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">Browse Jobs</p>
                    <p className="text-[11px]">Available once verified</p>
                  </div>
                </div>
              )}

              <Link
                href="/provider/bids"
                className="stat-card flex flex-col gap-2.5 p-4 rounded-2xl border border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Scale size={16} className="text-indigo-500" />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Bid History</span>
              </Link>

              <Link
                href="/profile"
                className="stat-card flex flex-col gap-2.5 p-4 rounded-2xl border border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <UserCheck size={16} className="text-blue-500" />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Edit Profile</span>
              </Link>

              <Link
                href="/support-chatbot"
                className="stat-card col-span-2 flex items-center gap-3 p-4 rounded-2xl border border-violet-200 dark:border-violet-800/30 bg-violet-50 dark:bg-violet-900/10 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-bold text-violet-700 dark:text-violet-400 flex-1">AI Assistant</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-violet-200 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded-full">AI</span>
              </Link>
            </div>
          </div>

          {/* Skills card */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                <Award size={15} className="text-amber-500" /> My Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(profile.skills) ? profile.skills : (profile.skills as string).split(',')).map((skill: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 font-medium">
                    {skill.toString().trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
