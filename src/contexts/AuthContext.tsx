import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing authentication...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session for:', session.user.email);
          await loadUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
        } else {
          console.log('ℹ️ No existing session found');
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          await loadUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed');
          // Don't reload profile on token refresh if we already have user data
          if (!user) {
            await loadUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email: string, userMetadata: any = {}) => {
    try {
      console.log('👤 Loading user profile for:', email);
      
      // Check if user profile exists
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, name, avatar, role, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading user profile:', error);
        // Use fallback profile
        setUser({
          id: userId,
          email: email,
          name: userMetadata?.name || userMetadata?.full_name || email.split('@')[0],
          role: 'user',
          createdAt: new Date()
        });
        setLoading(false);
        return;
      }

      if (!profile) {
        // Create new user profile
        console.log('📝 Creating new user profile');
        const newProfile = {
          id: userId,
          email: email,
          name: userMetadata?.name || userMetadata?.full_name || email.split('@')[0],
          role: 'user' as const,
          created_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select('id, email, name, avatar, role, created_at')
          .single();

        if (createError) {
          console.error('❌ Error creating user profile:', createError);
          // Use fallback
          setUser({
            id: userId,
            email: email,
            name: newProfile.name,
            role: 'user',
            createdAt: new Date()
          });
        } else {
          setUser({
            id: createdProfile.id,
            email: createdProfile.email,
            name: createdProfile.name,
            avatar: createdProfile.avatar,
            role: createdProfile.role,
            createdAt: new Date(createdProfile.created_at)
          });
        }
      } else {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          role: profile.role,
          createdAt: new Date(profile.created_at)
        });
      }

      setLoading(false);
      console.log('✅ User profile loaded successfully');
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
      // Fallback user
      setUser({
        id: userId,
        email: email,
        name: userMetadata?.name || userMetadata?.full_name || email.split('@')[0],
        role: 'user',
        createdAt: new Date()
      });
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting to sign in:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        setLoading(false);
        
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else {
          throw new Error(error.message || 'Failed to sign in. Please try again.');
        }
      }

      if (data.user && data.session) {
        console.log('✅ Sign in successful');
        // Profile will be loaded by auth state change listener
      } else {
        setLoading(false);
        throw new Error('Sign in failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('📝 Attempting to sign up:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            full_name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        setLoading(false);
        
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.');
        } else {
          throw new Error(error.message || 'Failed to create account. Please try again.');
        }
      }

      if (data.user) {
        console.log('✅ Sign up successful');
        if (!data.session) {
          setLoading(false);
          // Email confirmation required
          return;
        }
      } else {
        setLoading(false);
        throw new Error('Account creation failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out user');
    try {
      // Immediately clear user state
      setUser(null);
      setLoading(false);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        // Don't throw error, user state is already cleared
      }
      console.log('✅ Sign out completed');
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Don't throw error, user state is already cleared
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔄 Sending password reset email to:', email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      
      if (error) {
        console.error('❌ Password reset error:', error);
        throw new Error(error.message || 'Failed to send password reset email.');
      }
      
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Error sending password reset:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    console.log('📝 Updating user profile:', updates);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          avatar: updates.avatar,
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully');
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};