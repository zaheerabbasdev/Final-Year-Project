import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function UserModal({ userId, onClose, onRefresh }: { userId: number | null, onClose: () => void, onRefresh: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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


  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img 
                    src={`http://localhost:5000${user.avatar}`} 
                    alt={user.full_name} 
                    className="h-16 w-16 rounded-full object-cover border-2 border-indigo-100"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                      (e.target as any).nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-2xl ${user.avatar ? 'hidden' : 'flex'}`}
                >
                  {user.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
                  <p className="text-gray-500">{user.email} • {user.phone}</p>
                  <div className="mt-1 flex gap-2">
                    <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      {user.role}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      user.status === 'verified' ? 'bg-green-100 text-green-700' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      user.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-800 text-white'
                    }`}>
                      {user.status === 'blocked' ? 'suspended' : user.status}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === 'provider' && user.profile && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <h4 className="font-bold text-gray-900">Provider Profile</h4>
                  <p className="text-sm text-gray-600"><strong>Category:</strong> {user.profile.category_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600"><strong>Experience:</strong> {user.profile.experience_years} years</p>
                  <p className="text-sm text-gray-600"><strong>Bio:</strong> {user.profile.bio || 'N/A'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">CNIC Document</h5>
                      {user.profile.cnic_url ? (
                        <a href={`http://localhost:5000${user.profile.cnic_url}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-medium">View CNIC</a>
                      ) : <span className="text-sm text-gray-400">Not provided</span>}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Certificates</h5>
                      {user.profile.certificates_url ? (
                        <a href={`http://localhost:5000${user.profile.certificates_url}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-medium">View Certificates</a>
                      ) : <span className="text-sm text-gray-400">Not provided</span>}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">User not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
