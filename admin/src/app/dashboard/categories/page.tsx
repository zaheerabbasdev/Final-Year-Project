'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react';
import { PageHeader, TableSkeleton, EmptyState } from '@/components/AdminUI';

export default function CategoriesPage() {
  const [categories,   setCategories]   = useState<any[]>([]);
  const [newCategory,  setNewCategory]  = useState('');
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const data  = await api.get('/admin/categories', token || '');
      setCategories(data);
    } catch { console.error('Failed to fetch categories'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      await api.post('/admin/categories', { name: newCategory.trim() }, token || '');
      setNewCategory('');
      toast.success('Category added');
      fetchCategories();
    } catch { toast.error('Failed to add category'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Jobs using it may be affected.')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      await api.delete(`/admin/categories/${id}`, token || '');
      toast.success('Category deleted');
      fetchCategories();
    } catch { toast.error('Failed to delete category'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Manage service categories available to customers and providers."
        badge={`${categories.length} total`}
      />

      {/* Add form */}
      <div className="app-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-(--subtext) mb-3">Add Category</p>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="relative flex-1">
            <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--subtext) pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Home Cleaning, Plumber…"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              disabled={submitting}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-(--card-bg) border border-[var(--border-color)] text-(--text) placeholder-(--subtext) rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newCategory.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Add
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="app-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-(--card-bg)">
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-(--subtext)">#</th>
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-(--subtext)">Name</th>
              <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-(--subtext) text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : categories.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No categories yet"
                description="Add your first service category above."
              />
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-(--card-bg) transition-colors">
                  <td className="px-6 py-4 text-xs text-(--subtext) font-mono">#{cat.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-(--text)">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="p-2 rounded-lg text-(--subtext) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40"
                      title="Delete category"
                    >
                      {deletingId === cat.id
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Trash2 size={15} />
                      }
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
