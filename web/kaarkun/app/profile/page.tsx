'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { api, getFileUrl } from '../utils/api';
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
  BadgeCheck,
  Layers,
  Award,
  ChevronRight,
  Trash2
} from 'lucide-react';
import LocationInput from '../components/LocationInput';

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
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  // Use a ref so updateUser doesn't trigger the effect
  const updateUserRef = useRef(updateUser);
  useEffect(() => { updateUserRef.current = updateUser; }, [updateUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  // Reset broken flag whenever the avatar URL changes (e.g. after upload)
  useEffect(() => { setAvatarBroken(false); }, [user?.avatar]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

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
          setLatitude(freshUser.latitude || freshUser.profile?.latitude || null);
          setLongitude(freshUser.longitude || freshUser.profile?.longitude || null);

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
      latitude: latitude || user?.profile?.latitude || user?.latitude || 33.6844,
      longitude: longitude || user?.profile?.longitude || user?.longitude || 73.0479,
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
          ...user?.profile,
          bio,
          experience_years: parseInt(experienceYears) || 0,
          skills: skillsArray,
          category_id: categoryId ? parseInt(categoryId) : user?.profile?.category_id,
        } : user?.profile
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== 'DELETE') return;
    try {
      setDeleteLoading(true);
      await api.delete('/users/me');
      logout();
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Failed to delete account. Please try again.');
      setShowDeleteModal(false);
      setDeleteConfirmInput('');
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleName = user?.role === 'provider' ? 'Service Provider' : 'Customer';
  const providerCategory = categories.find(c => c.id === parseInt(categoryId))?.name || 'Provider';

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/30">
          <UserIcon size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">My Profile</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage your account details and preferences</p>
        </div>
      </div>

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
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow text-center relative overflow-hidden">
            {/* Role Header Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-600 to-indigo-600"></div>

            <div className="relative w-32 h-32 mx-auto mt-4">
              {user?.avatar && !avatarBroken ? (
                <img
                  src={getFileUrl(user.avatar)}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md"
                  onError={() => setAvatarBroken(true)}
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



            {/* Stats Row */}
            <div className="grid grid-cols-3 max-w-md mx-auto gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="stat-card p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                <div className="w-9 h-9 mx-auto mb-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Briefcase className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.totalJobs || 0}</span>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Jobs Posted</p>
              </div>
              <div className="stat-card p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                {user?.role === 'provider' ? (
                  <>
                    <div className="w-9 h-9 mx-auto mb-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500/20" />
                    </div>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}
                    </span>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Rating</p>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 mx-auto mb-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                      <Activity className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Active</span>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Status</p>
                  </>
                )}
              </div>

              {/* Provider availability toggle */}
              {user?.role === 'provider' && (
                <div className="stat-card flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                  <div className="text-left">
                    <div className="w-9 h-9 mb-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                      <BadgeCheck className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-zinc-755 dark:text-zinc-350">Available</span>
                    <p className="text-[10px] text-zinc-400">{isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOnlineToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOnline ? 'bg-emerald-500' : 'bg-zinc-350 dark:bg-zinc-700'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOnline ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Bio Form / Editor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow">
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
                  <LocationInput
                    value={location}
                    onChange={setLocation}
                    onCoordinatesChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                    required
                  />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="stat-card flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                      <Mail size={15} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Email Address</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="stat-card flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                      <Phone size={15} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Phone Number</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="stat-card sm:col-span-2 flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Service Location</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.location || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {user?.role === 'provider' && (
                  <>
                    <div className="stat-card flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04]">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                        <Award size={15} className="text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Experience</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{experienceYears} Years</p>
                      </div>
                    </div>

                    {skills && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                            <Layers size={12} className="text-violet-500" />
                          </div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Skills Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
                            <UserIcon size={12} className="text-indigo-500" />
                          </div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Bio Description</span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed bg-zinc-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/[0.04]">
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
            <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Customer Reviews {reviews.length > 0 && <span className="text-zinc-400 font-medium">({reviews.length})</span>}
                </h3>
                {reviews.length > 0 && (
                  <Link
                    href="/provider/reviews"
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    All Reviews <ChevronRight size={13} />
                  </Link>
                )}
              </div>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                  No reviews left by clients yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.slice(0, 4).map((r) => {
                    const tier = r.rating >= 4.5 ? 'emerald' : r.rating >= 3.5 ? 'blue' : r.rating >= 2.5 ? 'amber' : 'rose';
                    return (
                      <div
                        key={r.id}
                        className="stat-card relative overflow-hidden flex flex-col gap-3 p-4 rounded-xl border border-zinc-100 dark:border-white/[0.06] bg-zinc-50/30 dark:bg-white/[0.02] hover:shadow-md transition-all"
                      >
                        <div className={`absolute top-0 left-0 h-1 w-full bg-${tier}-400`} />

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {r.customer_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">{r.customer_name}</h4>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-${tier}-100 text-${tier}-700 dark:bg-${tier}-950/40 dark:text-${tier}-400`}>
                                <Star size={11} fill="currentColor" />
                                {r.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic font-light leading-relaxed bg-white/60 dark:bg-white/[0.02] p-3 rounded-lg border border-zinc-100 dark:border-white/[0.04]">
                          "{r.comment}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Danger Zone ──────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Danger Zone</h3>
              <p className="text-xs text-zinc-400">Permanently delete your account and all associated data</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            Delete My Account
          </button>
        </div>

      </div>

      {/* ── Delete-account confirmation modal ───────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/40 rounded-xl shrink-0">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-tight">Delete Account</h3>
                <p className="text-xs text-zinc-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              All your data — jobs, bookings, messages, and reviews — will be
              <span className="font-bold text-zinc-900 dark:text-white"> permanently deleted</span>.
              Type <span className="font-bold font-mono text-red-600 dark:text-red-400">DELETE</span> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="block w-full px-3 py-2.5 mb-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmInput(''); }}
                className="flex-1 py-2.5 text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmInput !== 'DELETE' || deleteLoading}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
