import React from 'react';
import { Brain, Shield, BookOpen, Settings, History, Users, User } from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLogoClick?: () => void;
  onAdminClick?: () => void;
  onNavigate?: (view: 'homepage' | 'analysis' | 'admin' | 'history' | 'workspaces' | 'profile') => void;
  currentView?: string;
  showAdminLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onAdminClick, 
  onNavigate,
  currentView,
  showAdminLink 
}) => {
  const { user } = useAuth();

  const navigationItems = [
    { id: 'analysis', label: 'Analyze', icon: BookOpen, requiresAuth: false },
    { id: 'history', label: 'History', icon: History, requiresAuth: true },
    { id: 'workspaces', label: 'Workspaces', icon: Users, requiresAuth: true },
  ];

  return (
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
              
              {showAdminLink && (
                <button 
                  onClick={onAdminClick}
                  className={`flex items-center space-x-2 transition-colors ${
                    currentView === 'admin'
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
            
            <UserMenu onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;