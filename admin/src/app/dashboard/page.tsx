'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Users, Briefcase, Gavel, Tag, TrendingUp, BarChart3 } from 'lucide-react';

/* ── CountUp ──────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(target); return; }
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setCount(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

/* ── Build current-year month scaffold (Jan → current month) ─────── */
function buildMonthGrid(apiData: { month: string; count: number }[]) {
  const now          = new Date();
  const year         = now.getFullYear();
  const monthsToShow = now.getMonth() + 1; // 1-indexed count up to current month
  return Array.from({ length: monthsToShow }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    const lbl = new Date(year, i, 1).toLocaleString('en-US', { month: 'short' });
    const hit = apiData.find(g => g.month === key);
    return { key, label: lbl, count: hit?.count ?? 0 };
  });
}

/* ── Types ────────────────────────────────────────────────────────── */
interface GrowthPoint   { month: string; count: number }
interface CategoryPoint { name: string;  count: number }
interface Stats {
  users?: number; activeJobs?: number; bids?: number; categories?: number;
  userGrowth?: GrowthPoint[]; categoryPopularity?: CategoryPoint[];
}

/* ── StatCard ─────────────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, bg }: {
  title: string; value: number; icon: React.ElementType; bg: string;
}) {
  const animated = useCountUp(value);
  return (
    <div className="app-card p-6 flex items-start gap-4">
      <div className={`shrink-0 p-3 rounded-2xl shadow-sm ${bg}`}>
        <Icon size={20} className="text-white" />
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
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--border-color)]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-24 rounded bg-[var(--border-color)]" />
        <div className="h-7 w-16 rounded bg-[var(--border-color)]" />
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
      <div className="h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ── BarChart ─────────────────────────────────────────────────────── */
function BarChart({ data }: { data: { key: string; label: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxCount = Math.max(1, ...data.map(d => d.count));
  const gridLines = [75, 50, 25]; // percent heights for dashed guides

  return (
    <div className="select-none">
      {/* Chart area */}
      <div className="relative h-48 mx-1">
        {/* Horizontal grid lines */}
        {gridLines.map(g => (
          <div
            key={g}
            className="absolute left-0 right-0 border-t border-dashed border-[var(--border-color)]"
            style={{ bottom: `${g}%` }}
          />
        ))}
        {/* Baseline */}
        <div className="absolute bottom-0 left-0 right-0 border-t-2 border-[var(--border-color)]" />

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1 px-0.5">
          {data.map((m, i) => {
            const pct = m.count > 0 ? Math.max((m.count / maxCount) * 100, 4) : 0;
            const isHov = hovered === i;
            return (
              <div
                key={m.key}
                className="relative flex-1 h-full flex flex-col justify-end cursor-default"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHov && m.count > 0 && (
                  <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-10
                                  bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
                                  text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                    {m.count} signup{m.count !== 1 ? 's' : ''}
                  </div>
                )}
                {/* Bar */}
                <div
                  className="w-full rounded-t-[3px] transition-all duration-500 ease-out"
                  style={{
                    height: `${pct}%`,
                    background: isHov
                      ? 'linear-gradient(to top, #1D4ED8, #38BDF8)'
                      : i % 2 === 0
                        ? 'linear-gradient(to top, #2563EB, #60A5FA)'
                        : 'linear-gradient(to top, #0EA5E9, #93C5FD)',
                    opacity: hovered !== null && !isHov ? 0.45 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Month labels */}
      <div className="flex gap-1 px-0.5 mt-2">
        {data.map((m) => (
          <div key={m.key} className="flex-1 text-center text-[9px] font-semibold text-(--subtext) uppercase tracking-wider">
            {m.label}
          </div>
        ))}
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

  const growthGrid       = buildMonthGrid(stats?.userGrowth ?? []);
  const categoryPopularity: CategoryPoint[] = stats?.categoryPopularity ?? [];
  const maxCategoryCount = Math.max(1, ...categoryPopularity.map(c => c.count));

  const STAT_CARDS = [
    { title: 'Total Customers', value: stats?.users      ?? 0, icon: Users,     bg: 'bg-blue-600' },
    { title: 'Active Jobs',     value: stats?.activeJobs ?? 0, icon: Briefcase, bg: 'bg-emerald-500' },
    { title: 'Total Bids',      value: stats?.bids       ?? 0, icon: Gavel,     bg: 'bg-amber-500' },
    { title: 'Categories',      value: stats?.categories ?? 0, icon: Tag,       bg: 'bg-sky-500' },
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
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-xl bg-blue-600 shadow-sm">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-(--text)">User Growth</h3>
              <p className="text-[11px] text-(--subtext)">New signups over the last 12 months</p>
            </div>
          </div>

          {loading ? (
            <div className="h-56 animate-pulse bg-[var(--border-color)] rounded-xl" />
          ) : (
            <BarChart data={growthGrid} />
          )}
        </div>

        {/* Category Popularity */}
        <div className="app-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-xl bg-sky-500 shadow-sm">
              <BarChart3 size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-(--text)">Popular Categories</h3>
              <p className="text-[11px] text-(--subtext)">Job distribution by service type</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-8 bg-[var(--border-color)] rounded" />)}
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
