import { useState, useEffect } from 'react';
import { api, fileOrigin } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function UserModal({ userId, onClose, onRefresh }: { userId: number | null, onClose: () => void, onRefresh: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const data = await api.get(`/admin/users/${userId}`, token || '');
      setUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoVerify = async () => {
    setVerifying(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.post(`/admin/providers/${userId}/auto-verify`, {}, token || '');
      toast.success(response.message || 'AI verification completed');
      fetchUserDetails();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Error running AI verification');
    } finally {
      setVerifying(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] rounded-[28px] shadow-[0_35px_60px_rgba(15,23,42,0.16)] w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[var(--text)]">User Details</h2>
          <button onClick={onClose} className="text-[var(--subtext)] hover:text-[var(--text)]">✕</button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img 
                    src={`${fileOrigin}${user.avatar}`}
                    alt={user.full_name} 
                    className="h-16 w-16 rounded-full object-cover border-2 border-[var(--primary)]/20"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                      (e.target as any).nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`h-16 w-16 ${user.avatar ? 'hidden' : 'flex'} bg-[var(--primary)]/10 rounded-full items-center justify-center font-bold text-[var(--primary)] text-2xl`}
                >
                  {user.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text)]">{user.full_name}</h3>
                  <p className="text-[var(--subtext)]">{user.email} • {user.phone}</p>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-[var(--subtext)]">
                      {user.role}
                    </span>
                    <span className={`px-2 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                      user.status === 'verified' ? 'bg-[var(--success)]/15 text-[var(--success)]' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      user.status === 'rejected' ? 'bg-[var(--danger)]/15 text-[var(--danger)]' :
                      'bg-slate-900 text-white'
                    }`}>
                      {user.status === 'blocked' ? 'suspended' : user.status}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === 'provider' && user.profile && (
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-[var(--text)]">Provider Profile</h4>
                  <p className="text-sm text-[var(--subtext)]"><strong>Category:</strong> {user.profile.category_name || 'N/A'}</p>
                  <p className="text-sm text-[var(--subtext)]"><strong>Experience:</strong> {user.profile.experience_years} years</p>
                  <p className="text-sm text-[var(--subtext)]"><strong>Bio:</strong> {user.profile.bio || 'N/A'}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h5 className="text-[10px] font-bold text-[var(--subtext)] uppercase tracking-wider mb-2">CNIC Document</h5>
                      {user.profile.cnic_url ? (
                        <a href={`${fileOrigin}${user.profile.cnic_url}`} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline text-sm font-medium">View CNIC</a>
                      ) : <span className="text-sm text-slate-400">Not provided</span>}
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-[var(--subtext)] uppercase tracking-wider mb-2">Certificates</h5>
                      {user.profile.certificates_url ? (
                        <a href={`${fileOrigin}${user.profile.certificates_url}`} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline text-sm font-medium">View Certificates</a>
                      ) : <span className="text-sm text-slate-400">Not provided</span>}
                    </div>
                  </div>

                  {user.profile.cnic_url && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-[12px] font-bold text-blue-900 flex items-center gap-2">
                          <span className="text-lg">✨</span> AI Document Verification
                        </h5>
                        {user.profile.ai_confidence_score !== null && user.profile.ai_confidence_score !== undefined ? (
                          <div className="mt-1">
                            <p className="text-sm text-blue-800">
                              <strong>Confidence:</strong> {user.profile.ai_confidence_score}%
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              <strong>Notes:</strong> {user.profile.ai_verification_notes}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-700 mt-1">Not verified by AI yet.</p>
                        )}
                      </div>
                      <button 
                        onClick={handleAutoVerify}
                        disabled={verifying}
                        className="app-button-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs px-4 py-2 whitespace-nowrap"
                      >
                        {verifying ? 'Verifying...' : 'Auto-Verify with AI'}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <p className="text-[var(--subtext)] text-center py-8">User not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
