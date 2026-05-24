import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  return (
    <aside className="w-72 bg-(--surface)/95 backdrop-blur-xl border-r border-slate-200/80 h-screen fixed left-0 top-0 overflow-y-auto shadow-2xl">
      <div className="p-6 border-b border-slate-200/80">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-11 w-11 bg-(--primary) rounded-3xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[rgba(0,59,149,0.16)]">K</div>
          <div>
            <span className="text-2xl font-bold text-(--text)">Kaarkun</span>
            <p className="text-xs text-(--subtext)">Admin Dashboard</p>
          </div>
        </Link>
      </div>

      <nav className="mt-6 px-4 space-y-2">
        <SidebarLink href="/dashboard" icon="📊" label="Dashboard" pathname={pathname} />
        <SidebarLink href="/dashboard/users" icon="👥" label="Customers" pathname={pathname} />
        <SidebarLink href="/dashboard/providers" icon="👷" label="Providers" pathname={pathname} />
        <SidebarLink href="/dashboard/jobs" icon="💼" label="Jobs" pathname={pathname} />
        <SidebarLink href="/dashboard/bids" icon="⚖️" label="Bids" pathname={pathname} />
        <SidebarLink href="/dashboard/categories" icon="📁" label="Categories" pathname={pathname} />
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-slate-200/80 bg-(--surface)/95">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-(--subtext) hover:text-(--danger) transition-colors font-medium w-full text-left"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, pathname }: { href: string; icon: string; label: string; pathname: string | null }) {
  const isActive = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-5 py-3 rounded-3xl transition-all font-medium ${isActive ? 'bg-(--primary)/12 text-(--primary) shadow-sm' : 'text-(--subtext) hover:bg-background hover:text-(--primary)'}`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
