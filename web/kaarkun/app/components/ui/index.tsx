/**
 * Kaarkun Web — Shared UI Primitives
 * Centralized reusable components for consistent design system.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════════════ */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-100 dark:bg-zinc-800/60 rounded-lg ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-4 flex items-start gap-4 animate-pulse"
        >
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════════════════════ */
export function EmptyState({
  icon: Icon = AlertCircle,
  title = 'Nothing here yet',
  description,
  action,
}: {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <div className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-600">
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STATUS BADGE
   ══════════════════════════════════════════════════════════════════ */
const STATUS_STYLES: Record<string, string> = {
  open:                   'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  active:                 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  completed:              'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  cancelled:              'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  confirmed:              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  in_progress:            'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  awaiting_confirmation:  'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  pending:                'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  accepted:               'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  rejected:               'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  verified:               'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  blocked:                'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export function StatusBadge({ status }: { status: string }) {
  const label = (status || '').replace(/_/g, ' ');
  const cls   = STATUS_STYLES[status] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COUNTER (Anime.js-style pure-React count-up)
   ══════════════════════════════════════════════════════════════════ */
export function CountUp({ target, duration = 900, className = '' }: {
  target: number;
  duration?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const reduced = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (reduced) { setCount(target); return; }

    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4); // ease-out-quart
      setCount(Math.round(target * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return <span className={className}>{count.toLocaleString()}</span>;
}

/* ══════════════════════════════════════════════════════════════════
   ALERT / INLINE FEEDBACK
   ══════════════════════════════════════════════════════════════════ */
export function Alert({
  type = 'error',
  message,
  icon: Icon = AlertCircle,
}: {
  type?: 'error' | 'success' | 'info' | 'warning';
  message: string;
  icon?: React.ElementType;
}) {
  const styles = {
    error:   'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    info:    'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  }[type];

  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm ${styles}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE HEADER
   ══════════════════════════════════════════════════════════════════ */
export function PageHeader({
  icon: Icon,
  iconBg = 'bg-blue-50 dark:bg-blue-950/30',
  iconColor = 'text-blue-600 dark:text-blue-400',
  title,
  subtitle,
  action,
}: {
  icon?: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CARD
   ══════════════════════════════════════════════════════════════════ */
export function Card({ children, className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SPINNER
   ══════════════════════════════════════════════════════════════════ */
export function Spinner({ size = 'md', className = '' }: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const s = { sm: 'h-5 w-5 border-[2px]', md: 'h-8 w-8 border-[2.5px]', lg: 'h-12 w-12 border-[3px]' }[size];
  return (
    <div className={`animate-spin rounded-full border-blue-600/20 border-t-blue-600 ${s} ${className}`} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex-grow flex items-center justify-center min-h-[50vh]">
      <Spinner size="md" />
    </div>
  );
}
