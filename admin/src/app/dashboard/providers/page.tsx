'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetchProviders();
    } catch (err) {
      alert('Failed to delete provider');
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
                      <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-700">
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
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(provider.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-indigo-600 p-2 transition-colors">⚙️</button>
                    <button 
                      onClick={() => handleDelete(provider.id)}
                      className="text-gray-400 hover:text-red-600 p-2 transition-colors"
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
    </div>
  );
}
