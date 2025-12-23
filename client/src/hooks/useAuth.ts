import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { createOrUpdateUser, getUserProfile, UserProfile } from '../firebase/firestore';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Storage key for registered users (localStorage backup)
const REGISTERED_USERS_KEY = 'shieldscan_registered_users';

interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  provider: string;
}

// Save user to localStorage as backup
function saveUserToLocalStorage(user: User) {
  if (typeof window === 'undefined' || !user.email) return;
  
  try {
    const saved = localStorage.getItem(REGISTERED_USERS_KEY);
    const users: RegisteredUser[] = saved ? JSON.parse(saved) : [];
    const existingIndex = users.findIndex(u => u.uid === user.uid);
    
    const userData: RegisteredUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: user.metadata?.creationTime || new Date().toISOString(),
      lastLoginAt: user.metadata?.lastSignInTime || new Date().toISOString(),
      provider: user.providerData?.[0]?.providerId || 'unknown',
    };

    if (existingIndex >= 0) {
      users[existingIndex] = userData;
    } else {
      users.push(userData);
    }

    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving user to localStorage:', e);
  }
}

/**
 * Custom hook for authentication state management with Firestore integration
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
    error: null,
  });

  // Save user to Firestore
  const syncUserToFirestore = useCallback(async (user: User) => {
    try {
      const profile = await createOrUpdateUser(user);
      setAuthState(prev => ({
        ...prev,
        userProfile: profile,
      }));
      console.log('User synced to Firestore:', profile.email);
    } catch (error) {
      console.error('Error syncing user to Firestore:', error);
      // Don't fail auth if Firestore sync fails
    }
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
        
        if (user) {
          // Save to localStorage as backup
          saveUserToLocalStorage(user);
          
          // Sync to Firestore
          try {
            const profile = await createOrUpdateUser(user);
            setAuthState({
              user,
              userProfile: profile,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error('Firestore sync error:', error);
            // Continue without Firestore profile
            setAuthState({
              user,
              userProfile: null,
              loading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            userProfile: null,
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        console.error('Auth error:', error);
        setAuthState({
          user: null,
          userProfile: null,
          loading: false,
          error: error.message,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAuthState({
        user: null,
        userProfile: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  // Refresh user profile from Firestore
  const refreshProfile = useCallback(async () => {
    if (!authState.user) return null;
    
    try {
      const profile = await getUserProfile(authState.user.uid);
      if (profile) {
        setAuthState(prev => ({
          ...prev,
          userProfile: profile,
        }));
      }
      return profile;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  }, [authState.user]);

  return {
    user: authState.user,
    userProfile: authState.userProfile,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    signOut,
    refreshProfile,
    // Helper properties from user object
    profile: authState.userProfile || (authState.user ? {
      uid: authState.user.uid,
      email: authState.user.email,
      displayName: authState.user.displayName,
      photoURL: authState.user.photoURL,
      plan: 'free' as const,
      scansUsed: 0,
      scansLimit: 1,
    } : null),
  };
};
