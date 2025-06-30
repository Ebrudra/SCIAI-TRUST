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
    let sessionCheckTimeout: NodeJS.Timeout;

    // Optimized session check with faster timeout
    const checkSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        
        // Set a shorter timeout to prevent long loading states
        sessionCheckTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('⏰ Session check timeout, setting loading to false');
            setLoading(false);
          }
        }, 5000); // Reduced from 10s to 5s

        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clear timeout if we get a response
        if (sessionCheckTimeout) {
          clearTimeout(sessionCheckTimeout);
        }
        
        if (error) {
          console.error('❌ Session check error:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session for user:', session.user.email);
          await loadUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        if (sessionCheckTimeout) {
          clearTimeout(sessionCheckTimeout);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes with optimized handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          setLoading(true);
          try {
            await loadUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
          } catch (error) {
            console.error('❌ Error loading profile after sign in:', error);
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.email);
          // Don't reload profile on token refresh if we already have user data
          if (!user) {
            setLoading(true);
            try {
              await loadUserProfile(session.user.id, session.user.email!, session.user.user_metadata);
            } catch (error) {
              console.error('❌ Error loading profile after token refresh:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email: string, userMetadata: any = {}) => {
    try {
      console.log('👤 Loading user profile for:', email);
      
      // Set a timeout for profile loading with faster fallback
      const profileTimeout = setTimeout(() => {
        console.warn('⏰ Profile loading timeout, using fallback');
        setUser({
          id: userId,
          email: email,
          name: userMetadata?.name || userMetadata?.full_name || email.split('@')[0],
          role: 'user',
          createdAt: new Date()
        });
        setLoading(false);
      }, 3000); // Reduced from 5s to 3s
      
      // Check if user profile exists in our users table with faster query
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, name, avatar, role, created_at')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      clearTimeout(profileTimeout);

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading user profile:', error);
        // Still set user with basic info even if profile loading fails
        setUser({
          id: userId,
          email: email,
          name: userMetadata?.name || userMetadata?.full_name || email.split('@')[0],
          role: 'user',
          createdAt: new Date()
        });
        return;
      }

      if (!profile) {
        // User doesn't exist, create profile
        console.log('📝 Creating new user profile for:', email);
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
          // Still set user with basic info even if profile creation fails
          setUser({
            id: userId,
            email: email,
            name: newProfile.name,
            role: 'user',
            createdAt: new Date()
          });
          return;
        }

        console.log('✅ User profile created successfully');
        setUser({
          id: createdProfile.id,
          email: createdProfile.email,
          name: createdProfile.name,
          avatar: createdProfile.avatar,
          role: createdProfile.role,
          createdAt: new Date(createdProfile.created_at)
        });
      } else {
        console.log('✅ User profile loaded successfully');
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          role: profile.role,
          createdAt: new Date(profile.created_at)
        });
      }
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
      // Fallback: set basic user info
      setUser({
        id: userId,
        email: email,
        name: userMetadata?.name || userMetadata?.full_name || email.split('@')[0],
        role: 'user',
        createdAt: new Date()
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting to sign in user:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        setLoading(false);
        
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        } else {
          throw new Error(error.message || 'Failed to sign in. Please try again.');
        }
      }

      if (data.user && data.session) {
        console.log('✅ Sign in successful for:', data.user.email);
        // User profile will be loaded by the auth state change listener
        // But we'll also load it here to ensure immediate state update
        await loadUserProfile(data.user.id, data.user.email!, data.user.user_metadata);
      } else {
        console.error('❌ No user data returned from sign in');
        setLoading(false);
        throw new Error('Sign in failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('📝 Attempting to sign up user:', email);
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
        
        // Provide more specific error messages
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error(error.message || 'Failed to create account. Please try again.');
        }
      }

      if (data.user) {
        console.log('✅ Sign up successful for:', data.user.email);
        
        // Check if email confirmation is required
        if (!data.session) {
          console.log('📧 Email confirmation required');
          setLoading(false);
          // Don't throw an error, just inform the user
          return;
        }
        
        // If we have a session, the user is automatically signed in
        console.log('✅ User automatically signed in after signup');
        // Profile will be created by the auth state change listener
      } else {
        console.error('❌ No user data returned from sign up');
        setLoading(false);
        throw new Error('Account creation failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out user');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      console.log('✅ Sign out successful');
      setUser(null);
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      throw error;
    } finally {
      setLoading(false);
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