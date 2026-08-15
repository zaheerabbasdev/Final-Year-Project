'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  User,
  Search,
  Briefcase,
  Scale,
  MessageSquare,
  LogOut,
  X,
  Sun,
  Moon,
  Bell,
  Bot,
  BookOpen,
  ClipboardList,
  ChevronRight,
  Wallet,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: ('customer' | 'provider')[];
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  if (!user) return null;

  const role = user.role as 'customer' | 'provider';
  const isCustomer = role === 'customer';
  const dashboardHref = isCustomer ? '/customer/dashboard' : '/provider/dashboard';

  const primaryItems: NavItem[] = [
    {
      href: dashboardHref,
      label: t('sidebar.dashboard'),
      icon: <LayoutDashboard size={17} />,
    },
    // Customer only
    {
      href: '/customer/post-job',
      label: t('sidebar.postJob'),
      icon: <Briefcase size={17} />,
      roles: ['customer'],
    },
    {
      href: '/customer/jobs',
      label: t('sidebar.myJobs'),
      icon: <ClipboardList size={17} />,
      roles: ['customer'],
    },
    {
      href: '/customer/bookings',
      label: t('sidebar.myBookings'),
      icon: <BookOpen size={17} />,
      roles: ['customer'],
    },
    {
      href: '/customer/wallet',
      label: t('wallet.sidebarLink'),
      icon: <Wallet size={17} />,
      roles: ['customer'],
    },
    // Provider only
    {
      href: '/provider/browse-jobs',
      label: t('sidebar.browseJobs'),
      icon: <Search size={17} />,
      roles: ['provider'],
    },
    {
      href: '/provider/bids',
      label: t('sidebar.myBids'),
      icon: <Scale size={17} />,
      roles: ['provider'],
    },
    {
      href: '/provider/wallet',
      label: t('wallet.sidebarLink'),
      icon: <Wallet size={17} />,
      roles: ['provider'],
    },
  ];

  const secondaryItems: NavItem[] = [
    { href: '/chat', label: t('sidebar.messages'), icon: <MessageSquare size={17} /> },
    { href: '/notifications', label: t('sidebar.notifications'), icon: <Bell size={17} /> },
    { href: '/profile', label: t('sidebar.myProfile'), icon: <User size={17} /> },
    { href: '/support-chatbot', label: t('sidebar.aiAssistant'), icon: <Bot size={17} />, badge: 'AI' },
  ];

  const renderItem = (item: NavItem) => {
    if (item.roles && !item.roles.includes(role)) return null;
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:scale-110'}`}>
          {item.icon}
        </span>
        <span className="flex-grow">{item.label}</span>
        {item.badge && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
            {item.badge}
          </span>
        )}
        {isActive && <ChevronRight size={13} className="shrink-0 opacity-70" />}
      </Link>
    );
  };

  const avatarInitial = user.full_name?.charAt(0)?.toUpperCase() || '?';
  // Both roles use blue-based gradient
  const roleColor = isCustomer
    ? 'from-blue-500 to-sky-400'
    : 'from-blue-600 to-sky-500';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[240px] flex flex-col
        bg-white dark:bg-[var(--sidebar-bg)]
        border-r border-slate-100 dark:border-white/[0.06]
        transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:shadow-none
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>

        {/* Logo / Brand */}
        <div className="h-[70px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shrink-0">
              <img src="/icon.png" alt="Kaarkun" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none">
                Kaarkun
              </p>
              <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                {t(isCustomer ? 'sidebar.customerPortal' : 'sidebar.providerPortal')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t(isCustomer ? 'sidebar.customerSection' : 'sidebar.providerSection')}
          </p>
          {primaryItems.map(renderItem)}

          <div className="h-px bg-slate-100 dark:bg-white/[0.06] my-3 mx-1" />

          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t('sidebar.general')}
          </p>
          {secondaryItems.map(item => renderItem(item))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-1 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400 shrink-0" />
            ) : (
              <Moon size={17} className="text-blue-500 shrink-0" />
            )}
            {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
          >
            <LogOut size={17} className="shrink-0" />
            {t('common.signOut')}
          </button>
        </div>
      </aside>
    </>
  );
}
