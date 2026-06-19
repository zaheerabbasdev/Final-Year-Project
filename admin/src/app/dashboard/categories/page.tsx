'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

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
      toast.success('Category added successfully');
      fetchCategories();
    } catch {
      toast.error('Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/categories/${id}`, token || '');
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--text)]">Manage Categories</h2>
      </div>

      {/* Add Category Form */}
      <div className="app-card p-6">
        <h3 className="text-sm font-bold text-[var(--subtext)] uppercase tracking-widest mb-4">Add New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="e.g. Home Cleaning, Plumber, etc."
            className="flex-1 px-4 py-3 text-[var(--text)] rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-sm bg-[var(--surface)]"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting}
            className="app-button-primary w-full sm:w-auto disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="app-card app-table overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={3} className="px-6 py-8 h-12 bg-gray-50" /></tr>)
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[var(--background)]/80 transition-colors">
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
