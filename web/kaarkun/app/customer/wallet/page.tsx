'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_type: 'topup' | 'withdrawal' | 'payment' | 'refund' | 'earning';
  balance_after: number;
  status: string;
  created_at: string;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function CustomerWalletPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  // Modal state
  const [modal, setModal] = useState<'topup' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/wallet');
      setBalance(data.balance ?? 0);
    } catch {
      showToast('error', t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchTransactions = useCallback(async (reset = false) => {
    try {
      const off = reset ? 0 : offset;
      if (!reset) setLoadingMore(true);
      const data = await api.get(`/wallet/transactions?limit=${LIMIT}&offset=${off}`);
      const list: Transaction[] = data.transactions ?? [];
      setTotal(data.total ?? 0);
      setTransactions(prev => reset ? list : [...prev, ...list]);
      setOffset(off + LIMIT);
    } catch {
      showToast('error', t('common.error'));
    } finally {
      setLoadingMore(false);
    }
  }, [offset, t]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'customer') { router.push('/login'); return; }
    fetchWallet();
    fetchTransactions(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleTopUp = async () => {
    const val = parseFloat(amount);
    if (!val || val < 100) return showToast('error', t('wallet.topUpMin'));
    if (val > 50000)       return showToast('error', t('wallet.topUpMax'));
    try {
      setProcessing(true);
      const res = await api.post('/wallet/topup', { amount: val });
      setBalance(res.new_balance);
      showToast('success', t('wallet.topUpSuccess'));
      setModal(null);
      setAmount('');
      fetchTransactions(true);
    } catch (err: any) {
      showToast('error', err.message || t('common.error'));
    } finally {
      setProcessing(false);
    }
  };

  const typeLabel = (tx: Transaction) => {
    const map: Record<string, string> = {
      topup: t('wallet.topupLabel'),
      withdrawal: t('wallet.withdrawalLabel'),
      payment: t('wallet.paymentLabel'),
      refund: t('wallet.refundLabel'),
      earning: t('wallet.earningLabel'),
    };
    return map[tx.reference_type] ?? tx.reference_type;
  };

  const typeColor = (tx: Transaction) =>
    tx.type === 'credit'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <RefreshCw size={28} className="animate-spin" />
          <p className="text-sm">{t('wallet.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium
          ${toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white p-8 shadow-xl shadow-indigo-500/20">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={20} className="opacity-80" />
            <span className="text-sm font-medium opacity-80">{t('wallet.balance')}</span>
          </div>
          <p className="text-4xl font-black tracking-tight mt-2">
            PKR {balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs opacity-60">{t('wallet.customerInfo')}</p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setModal('topup'); setAmount(''); }}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            >
              <Plus size={16} /> {t('wallet.topUp')}
            </button>
            <button
              onClick={() => { setModal('withdraw'); setAmount(''); }}
              disabled={balance < 500}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={16} /> {t('wallet.withdraw')}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold text-zinc-900 dark:text-white">{t('wallet.transactions')}</h2>
          <button
            onClick={() => fetchTransactions(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-zinc-400">
            <Wallet size={36} className="opacity-40" />
            <p className="font-medium">{t('wallet.noTransactions')}</p>
            <p className="text-sm text-center max-w-xs">{t('wallet.noTransactionsDesc')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50 dark:divide-white/[0.04]">
            {transactions.map(tx => (
              <li key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  tx.type === 'credit'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                }`}>
                  {tx.type === 'credit' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor(tx)}`}>
                      {typeLabel(tx)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}PKR {Number(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Bal: PKR {Number(tx.balance_after).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {transactions.length < total && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-white/[0.06]">
            <button
              onClick={() => fetchTransactions(false)}
              disabled={loadingMore}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-60"
            >
              {loadingMore ? t('common.loading') : `Load more (${total - transactions.length} remaining)`}
            </button>
          </div>
        )}
      </div>

      {/* Top-up modal */}
      {modal === 'topup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('wallet.topUpTitle')}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{t('wallet.topUpSubtitle')}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400">
                <X size={18} />
              </button>
            </div>

            {/* Quick amount pills */}
            <div className="flex gap-2 flex-wrap mb-4">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    amount === String(q)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400'
                  }`}
                >
                  PKR {q.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mb-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">{t('wallet.topUpAmount')}</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={t('wallet.topUpPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-5 mt-1.5">
              <Info size={12} />{t('wallet.topUpMin')} · {t('wallet.topUpMax')}
            </div>

            <button
              onClick={handleTopUp}
              disabled={processing || !amount}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? t('wallet.processing') : t('wallet.topUpBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {modal === 'withdraw' && (
        <WithdrawModal
          balance={balance}
          t={t}
          onClose={() => setModal(null)}
          onSuccess={(newBalance) => {
            setBalance(newBalance);
            showToast('success', t('wallet.withdrawSuccess'));
            setModal(null);
            setAmount('');
            fetchTransactions(true);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </div>
  );
}

function WithdrawModal({
  balance, t, onClose, onSuccess, onError
}: {
  balance: number;
  t: (k: string) => string;
  onClose: () => void;
  onSuccess: (b: number) => void;
  onError: (m: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [processing, setProcessing] = useState(false);

  const handle = async () => {
    const val = parseFloat(amount);
    if (!val || val < 500) return onError(t('wallet.withdrawMin'));
    if (val > balance)     return onError(t('wallet.insufficientBalance'));
    try {
      setProcessing(true);
      const res = await api.post('/wallet/withdraw', { amount: val, method });
      onSuccess(res.new_balance);
    } catch (err: any) {
      onError(err.message || t('common.error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('wallet.withdrawTitle')}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{t('wallet.withdrawSubtitle')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">{t('wallet.withdrawAmount')}</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={t('wallet.withdrawPlaceholder')}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-zinc-400 mt-1">{t('wallet.withdrawMin')} · Balance: PKR {balance.toLocaleString()}</p>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">{t('wallet.withdrawMethod')}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'bank_transfer', label: t('wallet.bankTransfer') },
              { key: 'jazzcash',      label: t('wallet.jazzCash')    },
              { key: 'easypaisa',     label: t('wallet.easyPaisa')   },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  method === m.key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handle}
          disabled={processing || !amount}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {processing ? t('wallet.processing') : t('wallet.withdrawBtn')}
        </button>
      </div>
    </div>
  );
}
