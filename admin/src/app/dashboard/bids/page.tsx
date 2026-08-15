'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import BidModal from '@/components/BidModal';
import { Gavel, Eye } from 'lucide-react';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState } from '@/components/AdminUI';

type Bid = {
  id: number;
  provider_name: string;
  job_title: string;
  amount: number;
  status: string;
  created_at: string;
};

const TH = 'px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-(--subtext)';
const TD = 'px-5 py-4';

export default function BidsPage() {
  const [bids,          setBids]          = useState<Bid[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data  = await api.get('/admin/bids', token || '');
      setBids(data);
    } catch { console.error('Failed to fetch bids'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBids(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Bids"
        subtitle="All bids submitted by service providers across the platform."
        badge={`${bids.length} bids`}
      />

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-(--card-bg)">
                <th className={TH}>Provider</th>
                <th className={TH}>Job</th>
                <th className={TH}>Amount (PKR)</th>
                <th className={TH}>Status</th>
                <th className={TH}>Date</th>
                <th className={`${TH} text-right`}>Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : bids.length === 0 ? (
                <EmptyState
                  icon={Gavel}
                  title="No bids yet"
                  description="Bids submitted by providers will appear here."
                />
              ) : (
                bids.map(bid => (
                  <tr key={bid.id} className="hover:bg-(--card-bg) transition-colors">
                    <td className={TD}>
                      <p className="text-sm font-semibold text-(--text)">{bid.provider_name}</p>
                    </td>
                    <td className={TD}>
                      <p className="text-sm text-(--subtext) line-clamp-1 max-w-[180px]">{bid.job_title}</p>
                    </td>
                    <td className={`${TD} text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums`}>
                      {Number(bid.amount).toLocaleString()}
                    </td>
                    <td className={TD}>
                      <StatusBadge status={bid.status} />
                    </td>
                    <td className={`${TD} text-sm text-(--subtext)`}>
                      {new Date(bid.created_at).toLocaleDateString()}
                    </td>
                    <td className={`${TD} text-right`}>
                      <button
                        onClick={() => setSelectedBidId(bid.id)}
                        className="p-2 rounded-lg text-(--subtext) hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                        title="View bid details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBidId && (
        <BidModal bidId={selectedBidId} onClose={() => setSelectedBidId(null)} />
      )}
    </div>
  );
}
