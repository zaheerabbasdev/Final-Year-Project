'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Bid = {
  id: number;
  provider_name: string;
  job_title: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data = await api.get('/admin/bids', token || '');
      setBids(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">Marketplace Bids</h2>
          <p className="text-sm text-slate-500 mt-1">Track your bid activity and vendor responses.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            {bids.length} Total Bids
        </span>
      </div>

      <div className="app-card app-table overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 h-12 bg-gray-50" /></tr>)
            ) : (
              bids.map((bid) => (
                <tr key={bid.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{bid.provider_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 line-clamp-1">{bid.job_title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                    ${bid.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`app-badge ${
                      bid.status === 'accepted' ? 'app-badge-success' : 
                      bid.status === 'pending' ? 'app-badge-info' : 'app-badge-danger'
                    }`}>
                      {bid.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(bid.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
