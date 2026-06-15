'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Search, 
  Filter, 
  X, 
  Send,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Zap,
  TrendingUp,
  Brain
} from 'lucide-react';

interface Job {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  customer_name?: string;
  budget: number;
  location: string;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  is_emergency: boolean;
  is_negotiable: boolean;
  created_at: string;
  // AI Matching fields
  match_score?: number;
  match_reasons?: string[];
  distance_km?: number;
}

interface Category {
  id: number;
  name: string;
}

interface AISuggestion {
  suggestedMin: number;
  suggestedMax: number;
  averagePrice: number;
  hasHistoricalData: boolean;
}

export default function BrowseJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Plumber' },
    { id: 2, name: 'Electrician' },
    { id: 3, name: 'Carpenter' },
    { id: 4, name: 'Painter' },
    { id: 5, name: 'Cleaner' },
    { id: 6, name: 'Gardener' },
    { id: 7, name: 'AC Repair' },
    { id: 8, name: 'Appliance Repair' }
  ]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('all');
  const [aiLoading, setAiLoading] = useState(false);

  // Modal State for bidding
  const [biddingJob, setBiddingJob] = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [bidLoading, setBidLoading] = useState(false);

  // AI Bid Suggestion State
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'provider') {
      router.push('/login');
      return;
    }

    // Load categories
    api.get('/categories')
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.log('Using fallback categories', err));

    fetchJobs();
  }, [user, authLoading, router]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.get('/jobs');
      const allJobs: Job[] = Array.isArray(data) ? data : data.jobs || [];
      setJobs(allJobs.filter(j => j.status === 'open'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch jobs feed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIMatchingJobs = async () => {
    try {
      setAiLoading(true);
      setError(null);
      const data = await api.get('/ai/matching-jobs');
      const matchedJobs: Job[] = Array.isArray(data) ? data : [];
      setJobs(matchedJobs.filter(j => j.status === 'open'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI Matching service unavailable. Showing standard feed.');
      // Fallback to regular jobs
      fetchJobs();
    } finally {
      setAiLoading(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'recommended') => {
    setActiveTab(tab);
    setSearch('');
    setSelectedCategory('');
    if (tab === 'recommended') {
      fetchAIMatchingJobs();
    } else {
      fetchJobs();
    }
  };

  const handleOpenBidModal = async (job: Job) => {
    setBiddingJob(job);
    setBidAmount(String(job.budget));
    setEstimatedTime('');
    setCoverLetter('');
    setBidError(null);
    setBidSuccess(null);
    setAiSuggestion(null);

    // Fetch AI bid suggestion automatically
    setAiSuggestionLoading(true);
    try {
      const suggestion = await api.get(`/ai/suggest-bid/${job.id}`);
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error('Failed to load AI bid suggestion', err);
    } finally {
      setAiSuggestionLoading(false);
    }
  };

  const handleCloseBidModal = () => {
    setBiddingJob(null);
    setAiSuggestion(null);
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingJob) return;
    setBidLoading(true);
    setBidError(null);
    setBidSuccess(null);

    try {
      await api.post('/bids', {
        job_id: biddingJob.id,
        amount: parseFloat(bidAmount),
        estimated_time: estimatedTime,
        cover_letter: coverLetter,
      });

      setBidSuccess('Bid submitted successfully!');
      setTimeout(() => {
        handleCloseBidModal();
        if (activeTab === 'recommended') {
          fetchAIMatchingJobs();
        } else {
          fetchJobs();
        }
      }, 1500);
    } catch (err: any) {
      setBidError(err.message || 'Failed to submit bid.');
    } finally {
      setBidLoading(false);
    }
  };

  // Instant emergency accept
  const handleInstantAccept = async (jobId: number) => {
    if (!confirm('This is an emergency job. Accepting it will instantly book you. Do you wish to continue?')) return;
    
    setError(null);
    try {
      const data = await api.post(`/jobs/${jobId}/express-accept`, {});
      alert(data.message || 'You have successfully booked this emergency job!');
      router.push('/provider/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to instantly accept job.');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? job.category_id === parseInt(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  const isLoading = authLoading || loading || aiLoading;

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Browse Jobs Feed
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse open listings in your community and send custom quotes.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* AI / All Tab Switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <Briefcase size={14} />
          All Jobs
        </button>
        <button
          onClick={() => handleTabChange('recommended')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'recommended'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
        >
          <Sparkles size={14} />
          AI Recommended
          <span className="px-1.5 py-0.5 bg-white/20 rounded-md text-[9px] font-bold">SMART</span>
        </button>
      </div>

      {/* AI Recommended Banner */}
      {activeTab === 'recommended' && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200/50 dark:border-violet-800/50 flex items-start gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
            <Brain size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-800 dark:text-violet-300">AI Smart Job Matching</p>
            <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-0.5">
              Jobs are ranked by AI based on your skills, location proximity, and success rate. Higher match scores mean better fit for you.
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search — only shown on All Jobs tab */}
      {activeTab === 'all' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              placeholder="Search keywords, description..."
            />
          </div>

          <div className="sm:w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Filter size={18} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
            >
              <option value="">All Skill Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            {aiLoading && (
              <p className="text-sm text-violet-600 dark:text-violet-400 font-semibold animate-pulse">
                AI is finding the best matches for you...
              </p>
            )}
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl">
          <p className="text-zinc-500 dark:text-zinc-400 text-base">No open jobs found{activeTab === 'recommended' ? ' matching your AI profile' : ' matching your filters'}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className={`bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all ${
                activeTab === 'recommended' && job.match_score && job.match_score >= 70
                  ? 'border-violet-200/60 dark:border-violet-800/50'
                  : 'border-zinc-200/60 dark:border-zinc-800/80'
              }`}
            >
              <div className="space-y-3 flex-grow max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {job.title}
                  </h3>
                  {job.is_emergency && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 rounded-full uppercase">
                      <AlertTriangle size={10} />
                      Emergency
                    </span>
                  )}
                  {categories.find(c => c.id === job.category_id) && (
                    <span className="px-2.5 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 rounded-full">
                      {job.category_name || categories.find(c => c.id === job.category_id)?.name}
                    </span>
                  )}

                  {/* AI Match Score Badge */}
                  {activeTab === 'recommended' && job.match_score !== undefined && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      job.match_score >= 70
                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400'
                        : job.match_score >= 45
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      <TrendingUp size={9} />
                      {job.match_score}% Match
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {job.description}
                </p>

                {/* AI Match Reasons */}
                {activeTab === 'recommended' && job.match_reasons && job.match_reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.match_reasons.map((reason, idx) => (
                      <span key={idx} className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded-md border border-violet-100 dark:border-violet-900/40">
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500 pt-1">
                  <span className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-250">
                    <DollarSign size={14} className="text-indigo-500" />
                    PKR {Number(job.budget).toLocaleString()} {job.is_negotiable && <span className="font-normal text-zinc-400">(Negotiable)</span>}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {job.location}
                    {job.distance_km !== undefined && (
                      <span className="text-violet-500 font-semibold">· {job.distance_km} km away</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex md:flex-col justify-end items-end gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 dark:border-zinc-800">
                {job.is_emergency ? (
                  <button
                    onClick={() => handleInstantAccept(job.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    <Zap size={12} />
                    Instant Accept
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenBidModal(job)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all"
                  >
                    Place a Bid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bidding Modal */}
      {biddingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={handleCloseBidModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              Place Bid: {biddingJob.title}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Client budget: PKR {Number(biddingJob.budget).toLocaleString()}
            </p>

            {/* AI Bid Suggestion Panel */}
            <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200/50 dark:border-violet-800/40">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-bold text-violet-800 dark:text-violet-300">AI Bid Price Suggestion</span>
              </div>
              {aiSuggestionLoading ? (
                <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                  <div className="animate-spin w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                  Analyzing historical bids...
                </div>
              ) : aiSuggestion ? (
                <div>
                  <div className="flex gap-3 text-center">
                    <div className="flex-1 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-violet-100 dark:border-violet-900/50">
                      <p className="text-[9px] text-zinc-400 uppercase font-bold">Min</p>
                      <p className="text-sm font-extrabold text-violet-700 dark:text-violet-400">PKR {aiSuggestion.suggestedMin.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 p-2 bg-violet-600 rounded-lg">
                      <p className="text-[9px] text-violet-200 uppercase font-bold">Avg</p>
                      <p className="text-sm font-extrabold text-white">PKR {aiSuggestion.averagePrice.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-violet-100 dark:border-violet-900/50">
                      <p className="text-[9px] text-zinc-400 uppercase font-bold">Max</p>
                      <p className="text-sm font-extrabold text-violet-700 dark:text-violet-400">PKR {aiSuggestion.suggestedMax.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 text-center">
                    {aiSuggestion.hasHistoricalData 
                      ? 'Based on historical accepted bids in this category.' 
                      : 'Based on job budget — limited data available.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBidAmount(aiSuggestion.averagePrice.toString())}
                    className="mt-2 w-full text-[10px] font-bold text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 rounded-lg py-1 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                  >
                    Use AI Average (PKR {aiSuggestion.averagePrice.toLocaleString()})
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">AI suggestion unavailable for this job.</p>
              )}
            </div>

            {bidError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-1.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{bidError}</span>
              </div>
            )}

            {bidSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-1.5">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>{bidSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Your Bid Amount (PKR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Estimated Delivery Time
                </label>
                <input
                  type="text"
                  required
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                  placeholder="e.g. 3 hours, 2 days"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Proposal Cover Letter
                </label>
                <textarea
                  required
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                  placeholder="Tell the client why you're a good fit for this job, your tools, experience..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseBidModal}
                  className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bidLoading}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                >
                  <Send size={12} />
                  {bidLoading ? 'Sending...' : 'Send Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
