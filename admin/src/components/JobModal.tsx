import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function JobModal({ jobId, onClose, onRefresh }: { jobId: number | null, onClose: () => void, onRefresh: () => void }) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    if (jobId) {
      // For now, since there isn't a specific GET /admin/jobs/:id route, 
      // we'll fetch all jobs and find the one we need, or the API can be added later.
      // We will assume the data passed from the parent or we just fetch jobs
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Fetching all jobs to filter since backend doesn't have a single job route yet
      const data = await api.get('/admin/jobs', token || '');
      const foundJob = data.find((j: any) => j.id === jobId);
      setJob(foundJob);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.post(`/admin/jobs/${jobId}/summarize-dispute`, {}, token || '');
      toast.success('Dispute summarized successfully');
      setJob({ ...job, ai_dispute_summary: response.summary });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Error generating summary');
    } finally {
      setSummarizing(false);
    }
  };

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] rounded-[28px] shadow-[0_35px_60px_rgba(15,23,42,0.16)] w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[var(--text)]">Job Details & Dispute Resolution</h2>
          <button onClick={onClose} className="text-[var(--subtext)] hover:text-[var(--text)]">✕</button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ) : job ? (
            <div className="space-y-6">
              
              <div className="bg-[var(--surface)] p-5 rounded-3xl border border-[var(--border-color)] space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text)]">{job.title}</h3>
                    <p className="text-sm text-[var(--subtext)] mt-1">Category: {job.category_name} • Budget: ${job.budget}</p>
                    <p className="text-sm text-[var(--subtext)] mt-1">Location: {job.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                    job.status === 'completed' ? 'bg-[var(--success)]/15 text-[var(--success)]' :
                    job.status === 'open' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--text)] text-sm">Description</h4>
                  <p className="text-sm text-[var(--subtext)] mt-1">{job.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* AI Dispute Summarizer Section */}
              <div className="mt-6 p-5 bg-[var(--primary)]/10 rounded-3xl border border-[var(--primary)]/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-[14px] font-bold text-[var(--primary)] flex items-center gap-2">
                      <span className="text-lg">⚖️</span> One-Click Dispute Resolution
                    </h5>
                    <p className="text-xs text-[var(--subtext)] mt-1">
                      Let AI read the entire chat history and provide a summary of the claims.
                    </p>
                  </div>
                  {!job.ai_dispute_summary && (
                    <button 
                      onClick={handleSummarize}
                      disabled={summarizing}
                      className="app-button-primary bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs px-4 py-2 whitespace-nowrap"
                    >
                      {summarizing ? 'Analyzing Chat...' : 'Analyze Dispute with AI'}
                    </button>
                  )}
                </div>

                {job.ai_dispute_summary && (
                  <div className="mt-4 p-4 bg-[var(--surface)] rounded-2xl border border-[var(--primary)]/20 shadow-sm">
                    <h6 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-3">AI Analysis Result</h6>
                    <div className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                      {job.ai_dispute_summary}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <p className="text-[var(--subtext)] text-center py-8">Job not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
