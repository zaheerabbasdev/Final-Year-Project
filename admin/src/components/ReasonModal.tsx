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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Please provide a brief explanation for this action. This will be visible to the user.
          </p>

          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type your reason here..."
            className="w-full h-32 p-4 text-black bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSubmit(reason);
                setReason('');
              }}
              className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all ${reason.trim() ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-gray-300 cursor-not-allowed'
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
