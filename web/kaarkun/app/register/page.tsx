'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Briefcase,
  Upload,
  AlertCircle,
  CheckCircle,
  FileCheck,
  Eye,
  EyeOff
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { t } = useLanguage();
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

  const [role, setRole] = useState<'customer' | 'provider'>('customer');

  const resetForm = () => {
    setFullName(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPassword('');
    setShowPassword(false); setShowConfirmPassword(false);
    setExperience(''); setCategoryId('');
    setAvatar(null); setCnic(null); setCertificates(null);
    setError(null); setSuccessMsg(null);
  };
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Files
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cnic, setCnic] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    // Attempt to fetch categories dynamically
    api.get('/categories')
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.log('Could not fetch categories from server, using fallback', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLocalLoading(true);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('role', role);

    if (avatar) formData.append('avatar', avatar);

    if (role === 'provider') {
      formData.append('experience_years', experience);
      formData.append('category_id', categoryId);
      if (cnic) formData.append('cnic', cnic);
      if (certificates) formData.append('certificates', certificates);
    }

    try {
      const res = await register(formData);
      if (res.requiresOTP) {
        if (res.emailSent === false) {
          setSuccessMsg(res.message || 'Account created! We could not send the email — use Resend Code on the next screen.');
          setTimeout(() => {
            router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          }, 2500);
        } else {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        }
      } else {
        setSuccessMsg(res.message || t('auth.register.providerSuccess'));
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-xl w-full space-y-8 bg-white dark:bg-zinc-900/40 p-8 sm:p-10 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {t('auth.register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {t('auth.register.alreadyHave')}{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>

        {/* Role Switcher tabs */}
        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => { resetForm(); setRole('customer'); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'customer'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {t('auth.register.iNeedServices')}
          </button>
          <button
            type="button"
            onClick={() => { resetForm(); setRole('provider'); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'provider'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {t('auth.register.iWantToWork')}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('auth.register.fullName')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder={t('auth.register.fullNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('auth.register.emailLabel')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder={t('auth.register.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('auth.register.phoneLabel')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder={t('auth.register.phonePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('auth.register.passwordLabel')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder={t('auth.register.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('auth.register.passwordHint')}</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-rose-500">Passwords do not match.</p>
              )}
            </div>
          </div>

          {/* Avatar upload for both roles */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('auth.register.profilePhoto')}
            </label>
            <div className="flex items-center gap-4">
              <label tabIndex={0} className="flex items-center justify-center px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors gap-2">
                <Upload size={16} />
                {t('auth.register.choosePhoto')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
              </label>
              {avatar && <span className="text-sm text-zinc-500">{avatar.name}</span>}
            </div>
          </div>

          {/* Provider Specific fields */}
          {role === 'provider' && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-6">
              <h3 className="text-md font-semibold text-zinc-800 dark:text-zinc-200">
                {t('auth.register.professionalDetails')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {t('auth.register.categoryLabel')}
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 block w-full py-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  >
                    <option value="">{t('auth.register.selectCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {t('auth.register.experienceLabel')}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    placeholder={t('auth.register.experiencePlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t('auth.register.cnicLabel')}
                  </label>
                  <div className="flex items-center gap-3">
                    <label tabIndex={0} className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors">
                      <Upload size={16} />
                      {t('auth.register.uploadCnic')}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        required
                        onChange={(e) => setCnic(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                      />
                    </label>
                    {cnic && <span className="text-sm text-zinc-500 truncate max-w-[150px]">{cnic.name}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Certifications
                  </label>
                  <div className="flex items-center gap-3">
                    <label tabIndex={0} className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors">
                      <Upload size={16} />
                      {t('auth.register.uploadFile')}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setCertificates(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                      />
                    </label>
                    {certificates && <span className="text-sm text-zinc-500 truncate max-w-[150px]">{certificates.name}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={localLoading || loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {localLoading || loading ? t('auth.register.creating') : t('auth.register.register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
