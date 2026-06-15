'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  User,
  Search,
  Briefcase, 
  Scale,
  FolderOpen,
  MessageSquare, 
  LogOut,
  X,
  Sun,
  Moon,
  Bell,
  Bot,
  BookOpen,
  ClipboardList,
  ChevronRight
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  roles?: ('customer' | 'provider')[];
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!user) return null;

  const role = user.role as 'customer' | 'provider';
  const dashboardHref = role === 'customer' ? '/customer/dashboard' : '/provider/dashboard';

  const navItems: NavItem[] = [
    // Role-specific primary section
    {
      href: dashboardHref,
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      roles: ['customer', 'provider'],
    },
    // Customer-only
    {
      href: '/customer/post-job',
      label: 'Post a Job',
      icon: <Briefcase size={18} />,
      roles: ['customer'],
    },
    {
      href: '/customer/jobs',
      label: 'My Jobs',
      icon: <ClipboardList size={18} />,
      roles: ['customer'],
    },
    {
      href: '/customer/bookings',
      label: 'My Bookings',
      icon: <BookOpen size={18} />,
      roles: ['customer'],
    },
    // Provider-only
    {
      href: '/provider/browse-jobs',
      label: 'Browse Jobs',
      icon: <Search size={18} />,
      roles: ['provider'],
    },
    {
      href: '/provider/bids',
      label: 'My Bids',
      icon: <Scale size={18} />,
      roles: ['provider'],
    },
  ];

  const sharedItems: NavItem[] = [
    {
      href: '/chat',
      label: 'Messages',
      icon: <MessageSquare size={18} />,
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
    },
    {
      href: '/profile',
      label: 'My Profile',
      icon: <User size={18} />,
    },
    {
      href: '/support-chatbot',
      label: 'AI Chatbot',
      icon: <Bot size={18} />,
    },
  ];

  const activeClass = 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 font-semibold shadow-sm';
  const inactiveClass = 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100';

  const renderItem = (item: NavItem) => {
    if (item.roles && !item.roles.includes(role)) return null;
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${isActive ? activeClass : inactiveClass}`}
      >
        <span className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
          {item.icon}
        </span>
        <span className="flex-grow">{item.label}</span>
        {isActive && <ChevronRight size={14} className="text-indigo-400 shrink-0" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 
        transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* Branding Header */}
        <div className="h-24 px-5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md">
              K
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                Kaarkun
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium capitalize">
                {role} portal
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-zinc-400 hover:text-zinc-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {/* Role-specific items */}
          <p className="px-4 mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
            {role === 'customer' ? 'Customer' : 'Provider'}
          </p>
          {navItems.map(renderItem)}

          {/* Divider */}
          <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-3 mx-2" />

          {/* Shared items */}
          <p className="px-4 mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">General</p>
          {sharedItems.map(item => renderItem(item))}
        </nav>

        {/* Footer: Theme + Logout */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/50 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400 shrink-0" />
            ) : (
              <Moon size={18} className="text-indigo-500 shrink-0" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-400"
          >
            <LogOut size={18} className="text-rose-400/70 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
