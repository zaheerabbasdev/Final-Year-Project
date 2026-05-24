'use client';
import { useState } from 'react';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
  submitText: string;
}

export default function ReasonModal({ isOpen, onClose, onSubmit, title, submitText }: ReasonModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] rounded-[28px] shadow-[0_35px_60px_rgba(15,23,42,0.16)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[var(--text)]">{title}</h3>
            <button onClick={onClose} className="text-[var(--subtext)] hover:text-[var(--text)] transition-colors">
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          <p className="text-sm text-[var(--subtext)] mb-4">
            Please provide a brief explanation for this action. This will be visible to the user.
          </p>

          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type your reason here..."
            className="w-full h-32 p-4 text-[var(--text)] bg-slate-50 border border-slate-200 rounded-[18px] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:bg-white outline-none transition-all resize-none"
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-[18px] text-sm font-bold text-[var(--subtext)] hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSubmit(reason);
                setReason('');
              }}
              className={`flex-1 px-4 py-3 rounded-[18px] text-sm font-bold text-white transition-all ${reason.trim() ? 'bg-[var(--primary)] hover:bg-[#002f77] shadow-[0_20px_40px_rgba(0,59,149,0.18)]' : 'bg-slate-300 cursor-not-allowed'
                }`}
              disabled={!reason.trim()}
            >
              {submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
