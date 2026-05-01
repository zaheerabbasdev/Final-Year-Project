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
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold text-gray-900">ServiceHub</span>
        </Link>
      </div>

      <nav className="mt-6 px-4 space-y-1">
        <SidebarLink href="/dashboard" icon="📊" label="Dashboard" />
        <SidebarLink href="/dashboard/users" icon="👥" label="Customers" />
        <SidebarLink href="/dashboard/providers" icon="👷" label="Providers" />
        <SidebarLink href="/dashboard/jobs" icon="💼" label="Jobs" />
        <SidebarLink href="/dashboard/bids" icon="⚖️" label="Bids" />
        <SidebarLink href="/dashboard/categories" icon="📁" label="Categories" />
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-500 hover:text-red-600 transition-colors font-medium w-full text-left"
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
      className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-xl transition-all font-medium"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
