'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  FileImage,
  Sparkles
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function PostJobPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Plumber' },
    { id: 2, name: 'Electrician' },
    { id: 3, name: 'Carpenter' },
    { id: 4, name: 'Painter' },
    { id: 5, name: 'Cleaner' },
    { id: 6, name: 'Gardener' },
    { id: 7, name: 'AC Repair' },
    { id: 8, name: 'Appliance Repair' }
  ]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [prefDate, setPrefDate] = useState('');
  const [prefTime, setPrefTime] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }

    // Load categories
    api.get('/categories')
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.log('Could not fetch categories, using fallback', err));
  }, [user, authLoading, router]);

  const handleAIAutocomplete = async () => {
    if (!description.trim() || description.length < 5) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const result = await api.post('/ai/autocomplete', {
        partialDescription: description
      });
      if (result) {
        if (result.completion) setDescription(result.completion);
        if (result.suggestedBudget) setBudget(result.suggestedBudget.toString());
        if (result.category) {
          const matchedCategory = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
          if (matchedCategory) {
            setCategoryId(matchedCategory.id.toString());
          }
        }
        setSuccess('AI suggestions applied! Budget, Category & Description updated.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI Autocomplete request failed.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...selectedFiles].slice(0, 6)); // Cap at 6
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLocalLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('budget', budget);
    formData.append('category_id', categoryId);
    formData.append('location', location);
    formData.append('preferred_date', prefDate || '');
    formData.append('preferred_time', prefTime || '');
    formData.append('is_negotiable', String(isNegotiable));
    formData.append('is_emergency', String(isEmergency));
    // Default coords for testing (Islamabad)
    formData.append('latitude', '33.6844');
    formData.append('longitude', '73.0479');

    images.forEach(img => {
      formData.append('images', img);
    });

    try {
      await api.post('/jobs', formData);
      setSuccess('Job posted successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to post job. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-zinc-900/40 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
        <div className="mb-8">
          <span className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4">
            <Briefcase size={24} />
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Post a Job</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Describe the service you need and start receiving bids from verified providers.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Job Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              placeholder="e.g. Repair kitchen sink pipeline leakage"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Describe what needs to be done
              </label>
              <button
                type="button"
                onClick={handleAIAutocomplete}
                disabled={localLoading || !description.trim() || description.length < 5}
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 rounded-lg border border-violet-100 dark:border-violet-900/50 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles size={12} />
                Improve with AI
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-55 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              placeholder="Provide details about the job. Specify materials, size, or special requirements if any."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Service Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Budget (PKR)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <DollarSign size={16} />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                  placeholder="e.g. 1500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Address / Location details
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <MapPin size={16} />
              </div>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                placeholder="e.g. Sector F-7, Islamabad"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Preferred Date (Optional)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  value={prefDate}
                  onChange={(e) => setPrefDate(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Preferred Time (Optional)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Clock size={16} />
                </div>
                <input
                  type="time"
                  value={prefTime}
                  onChange={(e) => setPrefTime(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col sm:flex-row gap-6 border-t border-b border-zinc-100 dark:border-zinc-800 py-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Budget is Negotiable</span>
                <p className="text-xs text-zinc-500">Providers can bid above or below your budget</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 border-zinc-300 focus:ring-rose-500"
              />
              <div className="flex gap-1.5 items-start">
                <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Emergency Job</span>
                  <p className="text-xs text-zinc-500">Providers can accept this job instantly without bidding</p>
                </div>
              </div>
            </label>
          </div>

          {/* Image uploads */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Add Images (Max 6)
            </label>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex flex-col items-center justify-center w-24 h-24 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <Upload size={20} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-500 mt-1">Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 border border-zinc-250 dark:border-zinc-800 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-center">
                  <div className="text-xs text-zinc-500 truncate max-w-[80px] flex flex-col items-center gap-1">
                    <FileImage size={24} className="text-indigo-400" />
                    <span className="text-[10px] select-none">{img.name.slice(0, 10)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 text-xs shadow-sm hover:shadow"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-sm font-semibold transition-all"
          >
            {localLoading ? 'Posting Job...' : 'Submit Job Post'}
          </button>

        </form>
      </div>
    </div>
  );
}
