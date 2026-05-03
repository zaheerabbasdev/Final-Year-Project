'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import UserModal from '@/components/UserModal';
import { toast } from 'react-hot-toast';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data = await api.get('/admin/users?role=provider', token || '');
      setProviders(data);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      toast.error('Failed to delete provider');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.put(`/admin/users/${id}/status`, { status: newStatus, reason }, token || '');
      toast.success(`Provider status updated to ${newStatus}`);
      fetchProviders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Service Providers</h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
            {providers.length} Total Providers
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 h-12 bg-gray-50" /></tr>)
            ) : (
              providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {provider.avatar ? (
                        <img 
                          src={`http://localhost:5000${provider.avatar}`} 
                          alt={provider.full_name} 
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                            (e.target as any).nextElementSibling.style.display = 'flex';
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
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium w-fit ${
                      provider.status === 'verified' ? 'text-green-600 bg-green-50' :
                      provider.status === 'pending' ? 'text-yellow-600 bg-yellow-50' :
                      provider.status === 'rejected' ? 'text-red-600 bg-red-50' :
                      'text-gray-100 bg-gray-800'
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
                      className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors"
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
                            const reason = window.prompt('Enter rejection reason:');
                            if (reason !== null) {
                              handleStatusChange(provider.id, 'rejected', reason);
                            }
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
                          const reason = window.prompt('Enter suspension reason (optional):');
                          if (reason !== null) {
                            handleStatusChange(provider.id, 'blocked', reason);
                          }
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
    </div>
  );
}
