import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function BidModal({ bidId, onClose }: { bidId: number | null, onClose: () => void }) {
  const [bid, setBid] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bidId) {
      fetchBidDetails();
    }
  }, [bidId]);

  const fetchBidDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Fetching all bids to filter since we don't have a specific GET /bids/:id route yet
      const data = await api.get('/admin/bids', token || '');
      const foundBid = data.find((b: any) => b.id === bidId);
      setBid(foundBid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!bidId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] rounded-[28px] shadow-[0_35px_60px_rgba(15,23,42,0.16)] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[var(--text)]">Bid Details</h2>
          <button onClick={onClose} className="text-[var(--subtext)] hover:text-[var(--text)]">✕</button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ) : bid ? (
            <div className="space-y-6">
              
              <div className="bg-[var(--surface)] p-5 rounded-3xl border border-[var(--border-color)] space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text)]">{bid.job_title}</h3>
                    <p className="text-sm text-[var(--subtext)] mt-1">Provider: <span className="font-semibold text-[var(--text)]">{bid.provider_name}</span></p>
                    <p className="text-sm text-[var(--subtext)] mt-1">Date: {new Date(bid.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">${bid.amount}</div>
                    <span className={`mt-2 inline-block px-2 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                      bid.status === 'accepted' ? 'bg-[var(--success)]/15 text-[var(--success)]' :
                      bid.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                      'bg-[var(--danger)]/15 text-[var(--danger)]'
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
                  <div>
                    <h4 className="font-bold text-[var(--text)] text-sm mb-1">Estimated Time</h4>
                    <p className="text-sm text-[var(--subtext)]">{bid.estimated_time || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-[var(--text)] text-sm mb-2">Cover Letter</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-[var(--subtext)] whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-700/50">
                    {bid.cover_letter || 'No cover letter provided.'}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <p className="text-[var(--subtext)] text-center py-8">Bid not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
