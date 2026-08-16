'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#services', label: 'Services' },
  { href: '#ai-features', label: 'AI Features' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 dark:border-white/[0.08] bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMobileMenu}>
            <span className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-blue-600/20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="Kaarkun" className="w-full h-full object-cover" />
            </span>
            <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              Kaarkun
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-blue-500" />
              )}
            </button>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors"
            >
              Sign Up
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-blue-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-zinc-200/70 dark:border-white/[0.08]">
            <nav className="pt-3 grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.1]"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMobileMenu}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600"
              >
                Sign Up
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
