'use client';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { api } from '@/lib/api';
import UserModal from '@/components/UserModal';
import ReasonModal from '@/components/ReasonModal';
import { toast } from 'react-hot-toast';

type User = {
  id: number;
  full_name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // State for Reason Modal
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [pendingUserAction, setPendingUserAction] = useState<{ id: number; status: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data = await api.get('/admin/users?role=customer', token || '');
      setUsers(data);
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/users/${id}`, token || '');
      toast.success('User deleted successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.put(`/admin/users/${id}/status`, { status: newStatus, reason }, token || '');
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage customer accounts, approvals and suspensions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            {users.length} Total Customers
          </span>
          <button className="app-button-secondary border border-slate-200 text-slate-500 px-4 py-2 rounded-2xl text-sm font-medium hover:bg-slate-50 transition-all">
            Export CSV
          </button>
        </div>
      </div>

      <div className="app-card app-table overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 h-12 bg-gray-50" /></tr>)
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`http://localhost:5000${user.avatar}`}
                          alt={user.full_name}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          onError={(e: SyntheticEvent<HTMLImageElement>) => {
                            // Fallback to initial if image fails to load
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const next = target.nextElementSibling as HTMLElement | null;
                            if (next) next.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 ${user.avatar ? 'hidden' : 'flex'}`}
                      >
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${user.role === 'provider' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium w-fit ${user.status === 'verified' ? 'text-green-600 bg-green-50' :
                      user.status === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                        user.status === 'rejected' ? 'text-red-600 bg-red-50' :
                          'text-gray-100 bg-gray-800'
                      }`}>
                      {user.status === 'blocked' ? 'suspended' : (user.status || 'pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="app-button-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                    >
                      View
                    </button>
                    {user.status === 'blocked' ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'verified')}
                        className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-100 transition-colors"
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setPendingUserAction({ id: user.id, status: 'blocked' });
                          setIsReasonModalOpen(true);
                        }}
                        className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-400 hover:text-red-600 px-3 py-1.5 transition-colors"
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRefresh={fetchUsers}
        />
      )}

      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => {
          setIsReasonModalOpen(false);
          setPendingUserAction(null);
        }}
        onSubmit={(reason) => {
          if (pendingUserAction) {
            handleStatusChange(pendingUserAction.id, pendingUserAction.status, reason);
          }
          setIsReasonModalOpen(false);
          setPendingUserAction(null);
        }}
        title="Account Suspension"
        submitText="Confirm Suspension"
      />
    </div>
  );
}
