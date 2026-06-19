'use client';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { api, fileOrigin } from '@/lib/api';
import UserModal from '@/components/UserModal';
import ReasonModal from '@/components/ReasonModal';
import { toast } from 'react-hot-toast';

type Provider = {
  id: number;
  full_name: string;
  email: string;
  avatar?: string;
  status: string;
  created_at: string;
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // State for Reason Modal
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [pendingProviderAction, setPendingProviderAction] = useState<{ id: number; status: string; title: string; button: string } | null>(null);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data = await api.get('/admin/users?role=provider', token || '');
      setProviders(data);
    } catch {
      console.error('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service provider?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/users/${id}`, token || '');
      toast.success('Provider deleted successfully');
      fetchProviders();
    } catch {
      toast.error('Failed to delete provider');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.put(`/admin/users/${id}/status`, { status: newStatus, reason }, token || '');
      toast.success(`Provider status updated to ${newStatus}`);
      fetchProviders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">Service Providers</h2>
          <p className="text-sm text-slate-500 mt-1">Review and manage provider accounts with confidence.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            {providers.length} Total Providers
        </span>
      </div>

      <div className="app-card app-table overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 h-12 bg-gray-50" /></tr>)
            ) : (
              providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {provider.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                      <img 
                          src={`${fileOrigin}${provider.avatar}`}
                          alt={provider.full_name} 
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          onError={(e: SyntheticEvent<HTMLImageElement>) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const next = target.nextElementSibling as HTMLElement | null;
                            if (next) next.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-700 ${provider.avatar ? 'hidden' : 'flex'}`}
                      >
                        {provider.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{provider.full_name}</p>
                        <p className="text-xs text-gray-500">ID: #{provider.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {provider.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`app-badge ${
                      provider.status === 'verified' ? 'app-badge-success' :
                      provider.status === 'pending' ? 'app-badge-warning' :
                      provider.status === 'rejected' ? 'app-badge-danger' :
                      'bg-slate-900 text-white'
                    }`}>
                      {provider.status === 'blocked' ? 'suspended' : (provider.status || 'pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(provider.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => setSelectedUserId(provider.id)}
                      className="app-button-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                    >
                      View
                    </button>
                    {provider.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(provider.id, 'verified')}
                          className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-100 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => {
                            setPendingProviderAction({ 
                              id: provider.id, 
                              status: 'rejected', 
                              title: 'Reject Application', 
                              button: 'Confirm Rejection' 
                            });
                            setIsReasonModalOpen(true);
                          }}
                          className="text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-orange-100 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {provider.status === 'verified' && (
                      <button 
                        onClick={() => {
                          setPendingProviderAction({ 
                            id: provider.id, 
                            status: 'blocked', 
                            title: 'Suspend Provider', 
                            button: 'Confirm Suspension' 
                          });
                          setIsReasonModalOpen(true);
                        }}
                        className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                      >
                        Suspend
                      </button>
                    )}

                    {provider.status === 'blocked' && (
                      <button 
                        onClick={() => handleStatusChange(provider.id, 'verified')}
                        className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                      >
                        Unsuspend
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(provider.id)}
                      className="text-gray-400 hover:text-red-600 px-3 py-1.5 transition-colors"
                      title="Delete Provider"
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
          onRefresh={fetchProviders} 
        />
      )}

      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => {
          setIsReasonModalOpen(false);
          setPendingProviderAction(null);
        }}
        onSubmit={(reason) => {
          if (pendingProviderAction) {
            handleStatusChange(pendingProviderAction.id, pendingProviderAction.status, reason);
          }
          setIsReasonModalOpen(false);
          setPendingProviderAction(null);
        }}
        title={pendingProviderAction?.title || 'Provide Reason'}
        submitText={pendingProviderAction?.button || 'Submit'}
      />
    </div>
  );
}
