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
  FileCheck,
  User as UserIcon,
  MessageSquare
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

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const jobsData = await api.get('/jobs/my/jobs');
        // Backends might return array of jobs directly or { data: [] }
        setJobs(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []);

        const bookingsData = await api.get('/bookings/my');
        setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data', err);
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your service posts, bids, and active hire details.
          </p>
        </div>
        <Link 
          href="/customer/post-job" 
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-sm font-semibold transition-all"
        >
          <Plus size={16} />
          Post a New Job
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: My Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
              My Job Posts
            </h2>
            
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">You haven't posted any jobs yet.</p>
                <Link href="/customer/post-job" className="inline-block mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Post your first job &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="group border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {job.title}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                          job.status === 'open' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                          job.status === 'active' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                          <DollarSign size={12} />
                          PKR {Number(job.budget).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-0 pt-3 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                      {job.status === 'open' && (
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md font-medium">
                          {job.bids_count || 0} Bids Received
                        </span>
                      )}
                      <Link 
                        href={`/customer/jobs/${job.id}`} 
                        className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                      >
                        Details
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Active Bookings */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              Active Bookings
            </h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
                No active bookings yet. Hired jobs will show up here.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                        {booking.job_title || `Booking #${booking.id}`}
                      </h4>
                      <span className={`mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                        booking.status === 'in_progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      <p className="flex items-center gap-1.5">
                        <UserIcon size={12} />
                        Hired: <span className="font-semibold text-zinc-850 dark:text-zinc-200">{booking.provider_name || 'Provider'}</span>
                      </p>
                      {booking.provider_phone && (
                        <p className="flex items-center gap-1.5">
                          Phone: <span className="text-zinc-850 dark:text-zinc-200">{booking.provider_phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <Link 
                        href={`/chat?jobId=${booking.job_id}&userId=${booking.provider_id}`} 
                        className="flex-1 text-center py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center justify-center gap-1"
                      >
                        <MessageSquare size={12} />
                        Message
                      </Link>
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
