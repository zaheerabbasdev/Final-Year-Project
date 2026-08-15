'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import JobModal from '@/components/JobModal';
import { toast } from 'react-hot-toast';
import { Briefcase, Eye, Trash2 } from 'lucide-react';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState, ActionBtn } from '@/components/AdminUI';

type Job = {
  id: number;
  title: string;
  location: string;
  category_name: string;
  budget: number;
  status: string;
  created_at: string;
};

const TH = 'px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-(--subtext)';
const TD = 'px-5 py-4';

export default function JobsPage() {
  const [jobs,          setJobs]          = useState<Job[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data  = await api.get('/admin/jobs', token || '');
      setJobs(data);
    } catch { console.error('Failed to fetch jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this job? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/jobs/${id}`, token || '');
      toast.success('Job deleted');
      fetchJobs();
    } catch { toast.error('Failed to delete job'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Listings"
        subtitle="All jobs posted by customers on the platform."
        badge={`${jobs.length} jobs`}
      />

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-(--card-bg)">
                <th className={TH}>Job</th>
                <th className={TH}>Category</th>
                <th className={TH}>Budget (PKR)</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <TableSkeleton rows={5} cols={5} />
              ) : jobs.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No jobs posted yet"
                  description="Jobs created by customers will appear here."
                />
              ) : (
                jobs.map(job => (
                  <tr key={job.id} className="hover:bg-(--card-bg) transition-colors">
                    <td className={TD}>
                      <p className="text-sm font-semibold text-(--text) line-clamp-1">{job.title}</p>
                      <p className="text-xs text-(--subtext) mt-0.5">{job.location}</p>
                    </td>
                    <td className={TD}>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-(--card-bg) text-(--subtext) border border-[var(--border-color)]">
                        {job.category_name}
                      </span>
                    </td>
                    <td className={`${TD} text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums`}>
                      {Number(job.budget).toLocaleString()}
                    </td>
                    <td className={TD}>
                      <StatusBadge status={job.status} />
                    </td>
                    <td className={`${TD} text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedJobId(job.id)}
                          className="p-2 rounded-lg text-(--subtext) hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                          title="View job details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 rounded-lg text-(--subtext) hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete job"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJobId && (
        <JobModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} onRefresh={fetchJobs} />
      )}
    </div>
  );
}
