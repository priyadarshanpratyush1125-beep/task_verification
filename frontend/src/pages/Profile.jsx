import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, LogOut, Save, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      await api.put('/api/users/me', { name });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      // In a real app, you'd want to update the AuthContext user object here too.
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setSecurityLoading(true);
    try {
      await api.put('/api/users/password', { 
        current_password: currentPassword, 
        new_password: newPassword 
      });
      setSecurityMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSecurityMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800">Settings</h2>
            </div>
            <nav className="flex-1 space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile Details</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'security' 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Lock className="w-5 h-5" />
                <span>Security</span>
              </button>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-200">
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8">
            {activeTab === 'profile' && (
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Profile Details</h3>
                
                {profileMessage && (
                  <div className={`mb-6 p-4 rounded-lg flex items-center text-sm ${
                    profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {profileMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    {profileMessage.text}
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                      value={user?.email || ''}
                    />
                    <p className="mt-1 text-xs text-slate-500">Email address cannot be changed.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <div className="px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm capitalize">
                      {user?.role || 'Employee'}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Security</h3>
                
                {securityMessage && (
                  <div className={`mb-6 p-4 rounded-lg flex items-center text-sm ${
                    securityMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {securityMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    {securityMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={securityLoading}
                      className="flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {securityLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Profile;
