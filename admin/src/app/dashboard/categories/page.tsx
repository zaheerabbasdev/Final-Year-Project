'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
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

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      await api.post('/admin/categories', { name: newCategory }, token || '');
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      alert('Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/categories/${id}`, token || '');
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
      </div>

      {/* Add Category Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input 
            type="text" 
            placeholder="e.g. Home Cleaning, Plumber, etc."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={submitting}
          />
          <button 
            type="submit" 
            disabled={submitting}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={3} className="px-6 py-8 h-12 bg-gray-50" /></tr>)
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    #{cat.id}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(cat.id)}
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
