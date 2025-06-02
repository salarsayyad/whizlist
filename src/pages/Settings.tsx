import { useState } from 'react';
import { User, Bell, Key, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  
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
              <button className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-error-600 hover:bg-error-50">
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
                      defaultValue="John Smith"
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
                      defaultValue="john.smith@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-medium text-xl">
                        JS
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
                
                <div className="space-y-4">
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
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-primary-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="current-password"
                          className="input"
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
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-primary-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm-password"
                          className="input"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button>
                        Update Password
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-primary-100">
                    <h3 className="text-primary-900 font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-primary-600 mb-4">Add an extra layer of security to your account</p>
                    
                    <Button variant="secondary">
                      Enable 2FA
                    </Button>
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