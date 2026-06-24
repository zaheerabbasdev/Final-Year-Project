'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-otp'];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => (
    pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  ));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPublicRoute(pathname)) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
