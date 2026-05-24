'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const data = await api.get('/admin/stats', token || '');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.users || 0} change="+12%" icon="👥" color="blue" />
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} change="+5%" icon="💼" color="green" />
        <StatCard title="Total Bids" value={stats?.bids || 0} change="+18%" icon="⚖️" color="orange" />
        <StatCard title="Revenue" value={`$${Math.round(stats?.revenue || 0).toLocaleString()}`} change="+24%" icon="💰" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="app-card p-6">
        <h3 className="text-lg text-[var(--text)] font-bold mb-6">User Growth</h3>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
            {[40, 70, 45, 90, 65, 80, 55, 95, 70, 85, 45, 75].map((v, i) => (
              <div key={i} className="bg-blue-100 w-full hover:bg-blue-500 transition-colors rounded-t-lg" style={{ height: `${v}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400 px-2 uppercase tracking-tight">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>

        <div className="app-card p-6">
          <h3 className="text-lg text-[var(--text)] font-bold mb-6">Popular Categories</h3>
          <div className="space-y-4">
            <CategoryProgressBar label="Cleaning" percent={75} color="bg-blue-500" />
            <CategoryProgressBar label="Plumbing" percent={45} color="bg-indigo-500" />
            <CategoryProgressBar label="Electric" percent={90} color="bg-purple-500" />
            <CategoryProgressBar label="Gardening" percent={30} color="bg-teal-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  return (
    <div className="app-card p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">{change}</span>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-[var(--text)] mt-1">{value?.toLocaleString()}</p>
      </div>
    </div>
  );
}

function CategoryProgressBar({ label, percent, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-400 font-bold">{percent}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
