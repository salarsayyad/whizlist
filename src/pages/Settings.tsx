import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Key, LogOut, Construction, Wrench } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const { supabase } = await import('../lib/supabase');
      
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });
      
      if (signInError) {
        setPasswordError('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        setPasswordError(updateError.message);
      } else {
        setPasswordSuccess('Password updated successfully');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordError('An unexpected error occurred. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-medium text-primary-900 mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="card p-4">
            <nav className="space-y-1">
              <button
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'account' 
                    ? 'bg-primary-100 text-primary-900 font-medium' 
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
                onClick={() => setActiveTab('account')}
              >
                <User size={18} />
                <span>Account</span>
              </button>
              <button
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'notifications' 
                    ? 'bg-primary-100 text-primary-900 font-medium' 
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                <span>Notifications</span>
              </button>
              <button
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'security' 
                    ? 'bg-primary-100 text-primary-900 font-medium' 
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <Key size={18} />
                <span>Security</span>
              </button>
            </nav>
            
            <div className="mt-6 pt-4 border-t border-primary-100">
              <button 
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-error-600 hover:bg-error-50"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          <div className="card p-6">
            {activeTab === 'account' && (
              <div>
                <h2 className="text-lg font-medium text-primary-900 mb-4">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-primary-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="input"
                      defaultValue={user?.user_metadata?.full_name || ''}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="input"
                      defaultValue={user?.email || ''}
                      disabled
                    />
                    <p className="mt-1 text-xs text-primary-500">
                      Email address cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-medium text-xl overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                          <img 
                            src={user.user_metadata.avatar_url} 
                            alt={user.user_metadata?.full_name || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {user?.user_metadata?.full_name?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2) || 'U'}
                          </span>
                        )}
                      </div>
                      <Button variant="secondary">
                        Change
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-medium text-primary-900 mb-4">Notification Preferences</h2>
                
                {/* Under Construction Message */}
                <motion.div 
                  className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-warning-100 rounded-full">
                      <Construction size={20} className="text-warning-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-warning-800 mb-1">Under Construction</h3>
                      <p className="text-sm text-warning-700">
                        We're currently enhancing our notification system to give you more control over your preferences.
                        This feature will be available soon!
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Wrench size={14} className="text-warning-500" />
                        <div className="bg-warning-200 h-1.5 rounded-full w-full overflow-hidden">
                          <div className="bg-warning-500 h-full rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-xs text-warning-600 font-medium">65%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <div className="space-y-4 opacity-60 pointer-events-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-primary-900 font-medium">Email Notifications</h3>
                      <p className="text-primary-600 text-sm">Receive emails about activity related to you</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-primary-900 font-medium">Comment Notifications</h3>
                      <p className="text-primary-600 text-sm">Get notified when someone comments on your items</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-primary-900 font-medium">Sharing Notifications</h3>
                      <p className="text-primary-600 text-sm">Get notified when someone shares an item with you</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-medium text-primary-900 mb-4">Security Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-primary-900 font-medium mb-2">Change Password</h3>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      {passwordError && (
                        <div className="p-3 bg-error-50 border border-error-200 rounded-md text-error-700 text-sm">
                          {passwordError}
                        </div>
                      )}
                      
                      {passwordSuccess && (
                        <div className="p-3 bg-success-50 border border-success-200 rounded-md text-success-700 text-sm">
                          {passwordSuccess}
                        </div>
                      )}
                      
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-primary-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="current-password"
                          className="input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-primary-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="new-password"
                          className="input"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <p className="mt-1 text-xs text-primary-500">
                          Password must be at least 6 characters long
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-primary-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm-password"
                          className="input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="pt-2">
                        <Button
                          type="submit"
                          isLoading={isChangingPassword}
                          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        >
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;