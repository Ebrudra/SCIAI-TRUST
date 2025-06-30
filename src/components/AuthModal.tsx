import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (mode !== 'reset' && !password.trim()) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        console.log('🔐 Attempting sign in for:', email);
        await signIn(email.trim(), password);
        console.log('✅ Sign in successful, closing modal');
        // Close modal immediately after successful sign in
        onClose();
        // Clear form
        setEmail('');
        setPassword('');
        setName('');
      } else if (mode === 'signup') {
        console.log('📝 Attempting sign up for:', email);
        await signUp(email.trim(), password, name.trim() || undefined);
        setSuccess('Account created successfully! You can now sign in.');
        // Switch to sign in mode after successful signup
        setTimeout(() => {
          setMode('signin');
          setSuccess(null);
          setPassword(''); // Clear password for security
        }, 2000);
      } else if (mode === 'reset') {
        console.log('🔄 Attempting password reset for:', email);
        await resetPassword(email.trim());
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    disabled={isLoading}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Email'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'signin' && (
              <div className="space-y-2">
                <button
                  onClick={() => switchMode('reset')}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
                <div>
                  <span className="text-sm text-gray-600">Don't have an account? </span>
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <span className="text-sm text-gray-600">Already have an account? </span>
                <button
                  onClick={() => switchMode('signin')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <span className="text-sm text-gray-600">Remember your password? </span>
                <button
                  onClick={() => switchMode('signin')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;