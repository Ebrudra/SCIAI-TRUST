import React, { useState, useEffect } from 'react';
import { Brain, Shield, BookOpen, Settings, History, Users, User, Bell, BarChart3 } from 'lucide-react';
import UserMenu from './UserMenu';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLogoClick?: () => void;
  onAdminClick?: () => void;
  onNavigate?: (view: 'homepage' | 'analysis' | 'admin' | 'history' | 'workspaces' | 'profile' | 'analytics') => void;
  onLogoutSuccess?: () => void;
  currentView?: string;
  showAdminLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onAdminClick, 
  onNavigate,
  onLogoutSuccess,
  currentView,
  showAdminLink 
}) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Mock unread notification count - in production, this would come from your API
    if (user) {
      setUnreadCount(3);
    }
  }, [user]);

  const navigationItems = [
    { id: 'analysis', label: 'Analyze', icon: BookOpen, requiresAuth: false },
    { id: 'history', label: 'History', icon: History, requiresAuth: true },
    { id: 'workspaces', label: 'Workspaces', icon: Users, requiresAuth: true },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin', icon: Settings, requiresAuth: true, adminOnly: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true, adminOnly: true },
  ];

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={onLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SciAI Trust Toolkit</h1>
                <p className="text-sm text-gray-500">AI Research Ethics Platform</p>
              </div>
            </button>
            
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const canShow = !item.requiresAuth || user;
                  
                  if (!canShow) return null;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate?.(item.id as any)}
                      className={`flex items-center space-x-2 transition-colors ${
                        isActive 
                          ? 'text-blue-600 font-medium' 
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                
                <a href="#ethics" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <Shield className="h-4 w-4" />
                  <span>Ethics Guidelines</span>
                </a>
                
                {showAdminLink && adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.id === 'admin' ? onAdminClick?.() : onNavigate?.(item.id as any)}
                      className={`flex items-center space-x-2 transition-colors ${
                        isActive
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
              
              <UserMenu onNavigate={onNavigate} onLogoutSuccess={onLogoutSuccess} />
            </div>
          </div>
        </div>
      </header>

      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;