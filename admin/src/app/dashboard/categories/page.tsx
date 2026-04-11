'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const data = await api.get('/admin/categories', token || '');
        setCategories(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
        const token = localStorage.getItem('adminToken');
        await api.post('/admin/categories', { name: newName, icon: 'default' }, token || '');
        window.location.reload();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Service Categories</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
            <input 
                type="text" 
                placeholder="New category..." 
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
            />
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">+ Add</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : (
            categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl">📁</div>
                        <span className="font-bold text-gray-800">{cat.name}</span>
                    </div>
                    <button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
