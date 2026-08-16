'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Users, Briefcase, Gavel, Tag, TrendingUp, BarChart3 } from 'lucide-react';

/* ── Anime.js counter helper ───────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef  = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setCount(target); return; }

    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quart
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(target * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

/* ── Types ────────────────────────────────────────────────────────── */
interface GrowthPoint   { month: string; count: number }
interface CategoryPoint { name: string;  count: number }
interface Stats {
  users?: number;
  activeJobs?: number;
  bids?: number;
  categories?: number;
  userGrowth?: GrowthPoint[];
  categoryPopularity?: CategoryPoint[];
}

/* ── StatCard ─────────────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, accent }: {
  title: string; value: number;
  icon: React.ElementType; accent: string;
}) {
  const animated = useCountUp(value);
  return (
    <div className="app-card p-6 flex items-start gap-4">
      <div className={`shrink-0 p-3 rounded-2xl ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest font-bold text-(--subtext)">{title}</p>
        <p className="text-3xl font-black text-(--text) mt-1 tabular-nums">{animated.toLocaleString()}</p>
      </div>
    </div>
  );
}

/* ── SkeletonCard ─────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="app-card p-6 flex items-start gap-4 animate-pulse">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--card-bg)]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-24 rounded bg-[var(--card-bg)]" />
        <div className="h-7 w-16 rounded bg-[var(--card-bg)]" />
      </div>
    </div>
  );
}

/* ── CategoryBar ─────────────────────────────────────────────────── */
function CategoryBar({ label, percent, delay }: { label: string; percent: number; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), delay);
    return () => clearTimeout(t);
  }, [percent, delay]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[13px]">
        <span className="font-semibold text-(--text)">{label}</span>
        <span className="text-(--subtext) font-bold tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 bg-[var(--card-bg)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const data  = await api.get('/admin/stats', token || '');
        setStats(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const userGrowth:        GrowthPoint[]   = stats?.userGrowth        || [];
  const categoryPopularity: CategoryPoint[] = stats?.categoryPopularity || [];
  const maxGrowth        = Math.max(1, ...userGrowth.map(m => m.count));
  const maxCategoryCount = Math.max(1, ...categoryPopularity.map(c => c.count));

  const STAT_CARDS = [
    { title: 'Total Customers', value: stats?.users       || 0, icon: Users,     accent: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
    { title: 'Active Jobs',     value: stats?.activeJobs  || 0, icon: Briefcase, accent: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
    { title: 'Total Bids',      value: stats?.bids        || 0, icon: Gavel,     accent: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
    { title: 'Categories',      value: stats?.categories  || 0, icon: Tag,       accent: 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-(--text)">Overview</h1>
        <p className="text-sm text-(--subtext) mt-0.5">Welcome back. Here's what's happening on Kaarkun.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading
          ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
          : STAT_CARDS.map(card => <StatCard key={card.title} {...card} />)
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="app-card p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-(--text)">User Growth</h3>
              <p className="text-[11px] text-(--subtext)">New signups over the last 12 months</p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 animate-pulse bg-[var(--card-bg)] rounded-xl" />
          ) : userGrowth.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-(--subtext)">
              <TrendingUp size={32} className="opacity-30" />
              <p className="text-sm">No signup data yet.</p>
            </div>
          ) : (
            <>
              <div className="relative h-48 flex gap-1.5 px-2">
                {userGrowth.map((m, i) => {
                  const pct = Math.max((m.count / maxGrowth) * 100, m.count > 0 ? 3 : 0);
                  return (
                    <div
                      key={m.month}
                      className="relative flex-1 h-full group cursor-default"
                      title={`${m.month}: ${m.count} signup${m.count !== 1 ? 's' : ''}`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700 ease-out group-hover:brightness-110"
                        style={{
                          height: `${pct}%`,
                          background: i % 2 === 0
                            ? 'linear-gradient(to top, #2563EB, #60A5FA)'
                            : 'linear-gradient(to top, #0EA5E9, #7DD3FC)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-3 px-2 text-[10px] font-semibold text-(--subtext) uppercase tracking-wider">
                {userGrowth.map(m => <span key={m.month}>{m.month.slice(5)}</span>)}
              </div>
            </>
          )}
        </div>

        {/* Category Popularity */}
        <div className="app-card p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-(--text)">Popular Categories</h3>
              <p className="text-[11px] text-(--subtext)">Job distribution by service type</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-8 bg-[var(--card-bg)] rounded" />)}
            </div>
          ) : categoryPopularity.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-(--subtext)">
              <BarChart3 size={32} className="opacity-30" />
              <p className="text-sm">No category data yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryPopularity.map((c, i) => (
                <CategoryBar
                  key={c.name}
                  label={c.name}
                  percent={Math.round((c.count / maxCategoryCount) * 100)}
                  delay={i * 80}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
