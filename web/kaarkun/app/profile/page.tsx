'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Star,
  Activity,
  Briefcase,
  Layers,
  Award
} from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  // Use a ref so updateUser doesn't trigger the effect
  const updateUserRef = useRef(updateUser);
  useEffect(() => { updateUserRef.current = updateUser; }, [updateUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  // Stats / Reviews states
  const [stats, setStats] = useState<any>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch fresh profile
        const freshUser = await api.get('/users/me');
        if (freshUser) {
          // Use ref to avoid updateUser causing a re-render loop
          updateUserRef.current(freshUser);
          setFullName(freshUser.full_name || '');
          setPhone(freshUser.phone || '');
          setLocation(freshUser.location || '');
          
          if (freshUser.role === 'provider') {
            const profile = freshUser.profile || {};
            setBio(profile.bio || '');
            setExperienceYears(profile.experience_years?.toString() || '0');
            
            // Format skills
            if (Array.isArray(profile.skills)) {
              setSkills(profile.skills.join(', '));
            } else if (profile.skills) {
              setSkills(profile.skills);
            } else {
              setSkills('');
            }
            
            setCategoryId(profile.category_id?.toString() || '');
            setIsOnline(!!profile.is_online);

            // Fetch reviews
            try {
              const reviewsData = await api.get(`/reviews/provider/${freshUser.id}`);
              setReviews(Array.isArray(reviewsData) ? reviewsData : reviewsData.reviews || []);
            } catch (err) {
              console.error('Failed to load reviews', err);
            }

            // Fetch dashboard stats if provider
            try {
              const jobsData = await api.get('/jobs/my/jobs');
              const totalJobs = Array.isArray(jobsData) ? jobsData.length : 0;
              setStats({ totalJobs });
            } catch (err) {
              console.error('Failed to load job stats', err);
            }
          } else if (freshUser.role === 'customer') {
            try {
              const jobsData = await api.get('/jobs/my/jobs');
              const totalJobs = Array.isArray(jobsData) ? jobsData.length : 0;
              setStats({ totalJobs });
            } catch (err) {
              console.error('Failed to load stats', err);
            }
          }
        }

        // Fetch categories for editing
        try {
          const cats = await api.get('/categories');
          if (Array.isArray(cats)) {
            setCategories(cats);
          }
        } catch (err) {
          console.error('Failed to load categories', err);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  // Only re-run when user ID or auth loading changes — NOT on every user object update
  }, [user?.id, authLoading, router]);

  const handleOnlineToggle = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    try {
      await api.patch('/users/me/online-status', { is_online: nextStatus });
    } catch (err: any) {
      console.error('Failed to update online status', err);
      setIsOnline(isOnline); // revert
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setSaveLoading(true);
      setError(null);
      const res = await api.post('/users/me/avatar', formData);
      if (res.avatarUrl) {
        updateUser({ avatar: res.avatarUrl });
        setSuccess('Avatar updated successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccess(null);

    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload: any = {
      full_name: fullName,
      phone,
      location,
      latitude: user?.profile?.latitude || 33.6844,
      longitude: user?.profile?.longitude || 73.0479,
    };

    if (user?.role === 'provider') {
      payload.bio = bio;
      payload.experience_years = parseInt(experienceYears) || 0;
      payload.skills = skillsArray;
      if (categoryId) {
        payload.category_id = parseInt(categoryId);
      }
    }

    try {
      await api.put('/users/me', payload);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Update local state
      updateUser({
        full_name: fullName,
        phone,
        location,
        profile: user?.role === 'provider' ? {
          ...user.profile,
          bio,
          experience_years: parseInt(experienceYears) || 0,
          skills: skillsArray,
          category_id: categoryId ? parseInt(categoryId) : user.profile?.category_id,
        } : user.profile
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const roleName = user?.role === 'provider' ? 'Service Provider' : 'Customer';
  const providerCategory = categories.find(c => c.id === parseInt(categoryId))?.name || 'Provider';

  return (
    <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm text-center relative overflow-hidden">
            {/* Role Header Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
            
            <div className="relative w-32 h-32 mx-auto mt-4">
              {user?.avatar ? (
                <img
                  src={`http://localhost:5000${user.avatar}`}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-violet-100 to-indigo-100 dark:from-violet-950/40 dark:to-indigo-950/40 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 shadow-md">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-lg hover:scale-105 transition-all">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={saveLoading}
                />
              </label>
            </div>

            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-4 leading-tight">
              {user?.full_name}
            </h2>
            <p className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mt-1">
              {user?.role === 'provider' ? providerCategory : roleName}
            </p>

            {/* Provider availability toggle */}
            {user?.role === 'provider' && (
              <div className="mt-6 flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                <div className="text-left">
                  <span className="text-xs font-bold text-zinc-755 dark:text-zinc-350">Status Availability</span>
                  <p className="text-[10px] text-zinc-400">{isOnline ? 'Online & Receiving Bids' : 'Offline Mode'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleOnlineToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOnline ? 'bg-emerald-500' : 'bg-zinc-350 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isOnline ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                <Briefcase className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.totalJobs || 0}</span>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Jobs Posted</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                {user?.role === 'provider' ? (
                  <>
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500/20 mx-auto mb-1.5" />
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}
                    </span>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Rating</p>
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Active</span>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Status</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Bio Form / Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Profile Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <UserIcon size={14} />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <Phone size={14} />
                      </div>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Location Details</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <MapPin size={14} />
                    </div>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                    />
                  </div>
                </div>

                {user?.role === 'provider' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Years of Experience</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                            <Award size={14} />
                          </div>
                          <input
                            type="number"
                            required
                            min="0"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Primary Skill Category</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                            <Layers size={14} />
                          </div>
                          <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                          >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Skills Tags (Comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Copper piping, Leak detection, Drain unclogging"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Bio Description</label>
                      <textarea
                        rows={4}
                        placeholder="Tell clients about yourself, your working style, and equipment..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Save size={14} />
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Email Address</span>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                      <Mail size={14} className="text-zinc-400" />
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Phone Number</span>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                      <Phone size={14} className="text-zinc-400" />
                      {user?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Service Location</span>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                      <MapPin size={14} className="text-zinc-400" />
                      {user?.location || 'Not provided'}
                    </p>
                  </div>
                </div>

                {user?.role === 'provider' && (
                  <>
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Experience</span>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {experienceYears} Years
                      </p>
                    </div>

                    {skills && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Skills Tags</span>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {skills.split(',').map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 text-xs font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bio && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Bio Description</span>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap leading-relaxed">
                          {bio}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Provider Reviews */}
          {user?.role === 'provider' && (
            <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-6">Customer Reviews</h3>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                  No reviews left by clients yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-950/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{r.customer_name}</h4>
                          <span className="text-[10px] text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star size={12} fill="currentColor" />
                          <span>{r.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 italic font-light">
                        "{r.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
