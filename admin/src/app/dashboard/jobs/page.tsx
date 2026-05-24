'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data = await api.get('/admin/jobs', token || '');
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/jobs/${id}`, token || '');
      fetchJobs();
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Job Listings</h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
            {jobs.length} Total Jobs
        </span>
      </div>

      <div className="app-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Budget</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 bg-gray-50 h-16" /></tr>)
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{job.location}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg italic">
                      {job.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                    ${job.budget}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      job.status === 'open' ? 'bg-blue-50 text-blue-600' : 
                      job.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-indigo-600 p-2">👁️</button>
                    <button 
                      onClick={() => handleDelete(job.id)}
                      className="text-gray-400 hover:text-red-600 p-2"
                    >
                      🗑️
                    </button>
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
