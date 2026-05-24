import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  return (
    <aside className="w-72 bg-[var(--surface)] border-r border-slate-200 h-screen fixed left-0 top-0 overflow-y-auto shadow-sm">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[var(--primary)] rounded-2xl flex items-center justify-center text-white font-bold text-lg">K</div>
          <span className="text-2xl font-bold text-[var(--text)]">Kaarkun</span>
        </Link>
      </div>

      <nav className="mt-6 px-4 space-y-2">
        <SidebarLink href="/dashboard" icon="📊" label="Dashboard" />
        <SidebarLink href="/dashboard/users" icon="👥" label="Customers" />
        <SidebarLink href="/dashboard/providers" icon="👷" label="Providers" />
        <SidebarLink href="/dashboard/jobs" icon="💼" label="Jobs" />
        <SidebarLink href="/dashboard/bids" icon="⚖️" label="Bids" />
        <SidebarLink href="/dashboard/categories" icon="📁" label="Categories" />
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 bg-[var(--surface)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-[var(--subtext)] hover:text-[var(--danger)] transition-colors font-medium w-full text-left"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-[var(--subtext)] hover:bg-[var(--background)] hover:text-[var(--primary)] rounded-2xl transition-all font-medium"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
