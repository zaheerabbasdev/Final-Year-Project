'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../utils/api';
import { KeyRound, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

function OTPContent() {
  const { verifyOtp } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown() {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const data = await api.post('/auth/resend-otp', { email });
      setInfo(data.message || 'A new verification code has been sent.');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setInfo(null);
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 bg-white dark:bg-zinc-900/40 p-8 sm:p-10 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm backdrop-blur-sm">
      <div className="text-center">
        <span className="inline-flex items-center justify-center p-3 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-4">
          <KeyRound size={28} />
        </span>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t('auth.verifyOtp.title')}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {t('auth.verifyOtp.subtitle')}{' '}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{email}</span>.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Info (resend success) */}
      {info && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm flex items-start gap-2">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{info}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center mb-2">
            {t('auth.verifyOtp.otpLabel')}
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="block w-full text-center tracking-widest text-2xl font-mono px-3 py-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder={t('auth.verifyOtp.otpPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
        >
          {loading ? t('auth.verifyOtp.verifying') : t('auth.verifyOtp.verify')}
        </button>
      </form>

      {/* Resend Code */}
      <div className="text-center pt-1">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          {t('auth.verifyOtp.didntReceive') || "Didn't receive the code?"}
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {resending ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              {t('auth.verifyOtp.sending') || 'Sending...'}
            </>
          ) : cooldown > 0 ? (
            `${t('auth.verifyOtp.resendIn')} ${cooldown}s`
          ) : (
            <>
              <RefreshCw size={14} />
              {t('auth.verifyOtp.resendCode')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <OTPContent />
      </Suspense>
    </div>
  );
}
