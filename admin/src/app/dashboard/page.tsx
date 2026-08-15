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

  const userGrowth: { month: string; count: number }[] = stats?.userGrowth || [];
  const maxGrowth = Math.max(1, ...userGrowth.map((m) => m.count));
  const categoryPopularity: { name: string; count: number }[] = stats?.categoryPopularity || [];
  const maxCategoryCount = Math.max(1, ...categoryPopularity.map((c) => c.count));
  const categoryColors = ['bg-[var(--primary)]', 'bg-blue-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.users || 0} icon="👥" color="blue" />
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon="💼" color="green" />
        <StatCard title="Total Bids" value={stats?.bids || 0} icon="⚖️" color="orange" />
        <StatCard title="Total Categories" value={stats?.categories || 0} icon="📑" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="app-card p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg text-(--text) font-bold mb-6">User Growth (last 12 months)</h3>
          {userGrowth.length === 0 ? (
            <p className="text-sm text-(--subtext) py-8 text-center">No signups in this period yet.</p>
          ) : (
            <>
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {userGrowth.map((m, i) => (
                  <div
                    key={m.month}
                    title={`${m.month}: ${m.count} new users`}
                    className="w-full rounded-t-3xl transition-all duration-300"
                    style={{ height: `${(m.count / maxGrowth) * 100}%`, background: i % 2 === 0 ? 'rgba(3, 105, 252, 0.16)' : 'rgba(10, 132, 255, 0.24)' }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-(--subtext) px-2 uppercase tracking-[0.2em]">
                {userGrowth.map((m) => <span key={m.month}>{m.month.slice(5)}</span>)}
              </div>
            </>
          )}
        </div>

        <div className="app-card p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg text-(--text) font-bold mb-6">Popular Categories</h3>
          {categoryPopularity.length === 0 ? (
            <p className="text-sm text-(--subtext) py-8 text-center">No categories yet.</p>
          ) : (
            <div className="space-y-4">
              {categoryPopularity.map((c, i) => (
                <CategoryProgressBar
                  key={c.name}
                  label={c.name}
                  percent={Math.round((c.count / maxCategoryCount) * 100)}
                  color={categoryColors[i % categoryColors.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    sky: 'text-sky-600 bg-sky-50',
  };

  return (
    <div className="app-card p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-(--text) mt-1">{value?.toLocaleString()}</p>
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
