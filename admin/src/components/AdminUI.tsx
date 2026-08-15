/**
 * Kaarkun Admin — shared UI primitives
 * Import what you need: <PageHeader>, <StatusBadge>, <EmptyState>, <TableSkeleton>
 */
'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

/* ── PageHeader ─────────────────────────────────────────────────── */
export function PageHeader({
  title, subtitle, badge, action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-(--text)">{title}</h1>
        {subtitle && <p className="text-sm text-(--subtext) mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-(--card-bg) text-(--subtext) border border-[var(--border-color)]">
            {badge}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

/* ── StatusBadge ────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, string> = {
  verified:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  rejected:    'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  blocked:     'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  open:        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  active:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  completed:   'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  cancelled:   'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  accepted:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status === 'blocked' ? 'suspended' : status;
  const cls = STATUS_MAP[status] || 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}

/* ── TableSkeleton ─────────────────────────────────────────────── */
export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <div className={`h-4 rounded-lg bg-(--card-bg) ${c === 0 ? 'w-40' : c === cols - 1 ? 'w-20 ml-auto' : 'w-24'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── EmptyState ────────────────────────────────────────────────── */
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
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="p-4 rounded-2xl bg-(--card-bg) text-(--subtext)">
            <Icon size={32} className="opacity-50" />
          </div>
          <div>
            <p className="font-semibold text-(--text)">{title}</p>
            {description && <p className="text-sm text-(--subtext) mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      </td>
    </tr>
  );
}

/* ── AvatarCell ────────────────────────────────────────────────── */
export function AvatarCell({
  name, email, avatarUrl,
}: {
  name: string; email?: string; avatarUrl?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-9 w-9 rounded-full object-cover border border-[var(--border-color)]"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-(--text) truncate">{name}</p>
        {email && <p className="text-xs text-(--subtext) truncate">{email}</p>}
      </div>
    </div>
  );
}

/* ── ActionBtn ─────────────────────────────────────────────────── */
export function ActionBtn({
  children, variant = 'default', onClick, disabled,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls = {
    default: 'bg-(--card-bg) text-(--text) border border-[var(--border-color)] hover:bg-(--surface)',
    danger:  'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40',
    success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40',
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}
