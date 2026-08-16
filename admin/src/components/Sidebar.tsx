'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  HardHat,
  Briefcase,
  Gavel,
  Tag,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/users',      icon: Users,           label: 'Customers' },
  { href: '/dashboard/providers',  icon: HardHat,         label: 'Providers' },
  { href: '/dashboard/jobs',       icon: Briefcase,       label: 'Jobs' },
  { href: '/dashboard/bids',       icon: Gavel,           label: 'Bids' },
  { href: '/dashboard/categories', icon: Tag,             label: 'Categories' },
];

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-(--surface) border-r border-[var(--border-color)] h-screen fixed left-0 top-0 flex flex-col shadow-xl z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--border-color)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="Kaarkun" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-(--text) tracking-tight">Kaarkun</span>
            <p className="text-[10px] text-(--subtext) uppercase tracking-wider font-semibold">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-(--subtext) hover:bg-[var(--card-bg)] hover:text-(--text)'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-(--subtext) group-hover:text-(--text) transition-colors'} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={12} className="text-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[var(--border-color)]">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-(--subtext) hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={16} className="transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
