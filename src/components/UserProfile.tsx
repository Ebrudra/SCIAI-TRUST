import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Shield, 
  Bell, 
  Download, 
  Trash2,
  Edit,
  Save,
  X,
  Camera,
  Key,
  Globe,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserSettings {
  emailNotifications: boolean;
  shareAnalytics: boolean;
  publicProfile: boolean;
  autoSave: boolean;
  defaultProvider: 'openai' | 'gemini';
  exportFormat: 'pdf' | 'docx' | 'markdown';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'data'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    shareAnalytics: false,
    publicProfile: false,
    autoSave: true,
    defaultProvider: 'openai',
    exportFormat: 'pdf'
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editedProfile.name,
        avatar: editedProfile.avatar
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  const handleSettingsChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: Save settings to backend
  };

  const handleSecurityChange = (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
    // TODO: Save security settings to backend
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      // TODO: Implement password change API
      console.log('Changing password...');
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    }
  };

  const handleExportData = async () => {
    try {
      // TODO: Implement data export
      console.log('Exporting user data...');
      alert('Data export will be sent to your email');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation === 'DELETE') {
      try {
        // TODO: Implement account deletion
        console.log('Deleting account...');
        alert('Account deletion initiated. You will receive a confirmation email.');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account');
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Download }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-sm text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-lg font-medium text-blue-600">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name || 'User'}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full" />
                          ) : (
                            <span className="text-2xl font-medium text-blue-600">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {isEditing && (
                          <button className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                            <Camera className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
                        <p className="text-sm text-gray-500">Upload a photo to personalize your account</p>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile.name}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{user.name || 'Not set'}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900">{user.email}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Contact support to change your email address
                      </p>
                    </div>

                    {/* Account Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Type
                        </label>
                        <p className="text-gray-900 capitalize">{user.role}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </label>
                        <p className="text-gray-900">{user.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    {/* Notifications */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-700">Email Notifications</span>
                            <p className="text-xs text-gray-500">Receive updates about your analyses</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Privacy */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Privacy</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-700">Share Analytics</span>
                            <p className="text-xs text-gray-500">Help improve our service with anonymous usage data</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.shareAnalytics}
                            onChange={(e) => handleSettingsChange('shareAnalytics', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-700">Public Profile</span>
                            <p className="text-xs text-gray-500">Allow others to see your public analyses</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.publicProfile}
                            onChange={(e) => handleSettingsChange('publicProfile', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Defaults */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Defaults</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Default AI Provider
                          </label>
                          <select
                            value={settings.defaultProvider}
                            onChange={(e) => handleSettingsChange('defaultProvider', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="openai">OpenAI GPT-4</option>
                            <option value="gemini">Google Gemini</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Default Export Format
                          </label>
                          <select
                            value={settings.exportFormat}
                            onChange={(e) => handleSettingsChange('exportFormat', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pdf">PDF</option>
                            <option value="docx">Word Document</option>
                            <option value="markdown">Markdown</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Password */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Password</h3>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-700">Password</p>
                          <p className="text-xs text-gray-500">Last changed 30 days ago</p>
                        </div>
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-700">2FA Status</p>
                          <p className="text-xs text-gray-500">
                            {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSecurityChange('twoFactorEnabled', !securitySettings.twoFactorEnabled)}
                          className={`px-3 py-2 rounded-md text-sm ${
                            securitySettings.twoFactorEnabled
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                      </div>
                    </div>

                    {/* Session Settings */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Session Management</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Session Timeout (minutes)
                          </label>
                          <select
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={0}>Never</option>
                          </select>
                        </div>
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-700">Login Alerts</span>
                            <p className="text-xs text-gray-500">Get notified of new login attempts</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={securitySettings.loginAlerts}
                            onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Data & Privacy</h2>
                  
                  <div className="space-y-6">
                    {/* Data Export */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Export Your Data</h3>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-700 mb-3">
                          Download a copy of all your data including analyses, papers, and settings.
                        </p>
                        <button
                          onClick={handleExportData}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export Data</span>
                        </button>
                      </div>
                    </div>

                    {/* Data Retention */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Data Retention</h3>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">
                          Your data is retained according to our privacy policy:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Analysis data: Retained until account deletion</li>
                          <li>• Usage analytics: Anonymized after 90 days</li>
                          <li>• Account data: Retained until account deletion</li>
                        </ul>
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Delete Account</h3>
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <p className="text-sm text-red-700 mb-3">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;