'use client';

/**
 * Auth Context
 * Global authentication state management
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { getUserProfile, createOrUpdateUserProfile, UserProfile } from '@/firebase/firestore';
import { setUserContext, clearUserContext } from '@/lib/sentry';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// TYPES
// =============================================================================

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  // Load user profile
  const loadProfile = useCallback(async (user: User): Promise<UserProfile | null> => {
    try {
      let profile = await getUserProfile(user.uid);
      
      if (!profile) {
        // Create profile if it doesn't exist
        await createOrUpdateUserProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          plan: 'free',
        });
        profile = await getUserProfile(user.uid);
      }
      
      return profile;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'auth', operation: 'loadProfile' },
      });
      return null;
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set Sentry user context
        setUserContext({
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        const profile = await loadProfile(user);
        
        setState({
          user,
          profile,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        clearUserContext();
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, [loadProfile]);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      // Create user profile
      await createOrUpdateUserProfile(result.user.uid, {
        email,
        displayName: displayName || '',
        plan: 'free',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      setState(prev => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'auth', operation: 'signOut' },
      });
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'auth', operation: 'resetPassword' },
      });
      throw error;
    }
  }, []);

  // Update profile
  const updateUserProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    if (!state.user) throw new Error('No user logged in');
    
    try {
      await updateProfile(state.user, updates);
      
      // Also update Firestore profile
      await createOrUpdateUserProfile(state.user.uid, updates);
      
      // Refresh profile state
      const profile = await loadProfile(state.user);
      setState(prev => ({ ...prev, profile }));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'auth', operation: 'updateProfile' },
      });
      throw error;
    }
  }, [state.user, loadProfile]);

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    if (!state.user) throw new Error('No user logged in');
    
    try {
      await sendEmailVerification(state.user);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'auth', operation: 'resendVerification' },
      });
      throw error;
    }
  }, [state.user]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    
    const profile = await loadProfile(state.user);
    setState(prev => ({ ...prev, profile }));
  }, [state.user, loadProfile]);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateUserProfile,
    resendVerificationEmail,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;

