import React, { useState } from 'react';
import { User, Settings, LogOut, History, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface UserMenuProps {
  onNavigate?: (view: 'homepage' | 'analysis' | 'admin' | 'history' | 'workspaces' | 'profile') => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
      onNavigate?.('homepage');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleMenuItemClick = (view: 'history' | 'workspaces' | 'profile') => {
    setIsMenuOpen(false);
    onNavigate?.(view);
  };

  if (!user) {
    return (
      <>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => openAuthModal('signin')}
            className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <span className="text-sm font-medium text-blue-600">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm font-medium hidden md:block">{user.name || user.email}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                <button
                  onClick={() => handleMenuItemClick('profile')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => handleMenuItemClick('history')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <History className="h-4 w-4" />
                  <span>Analysis History</span>
                </button>

                <button
                  onClick={() => handleMenuItemClick('workspaces')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Users className="h-4 w-4" />
                  <span>Workspaces</span>
                </button>

                <div className="border-t border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default UserMenu;