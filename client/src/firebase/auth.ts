import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GithubAuthProvider,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from './config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// User profile type
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
  subscription: {
    plan: 'free' | 'pro' | 'business';
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart: any | null;
    currentPeriodEnd: any | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    scansThisMonth: number;
    scansLimit: number;
    lastResetDate: any;
  };
  settings: {
    emailNotifications: boolean;
    reportLanguage: 'en' | 'fr';
    timezone: string;
  };
  gdpr: {
    consentGiven: boolean;
    consentDate: any | null;
    dataProcessingAllowed: boolean;
    marketingConsent: boolean;
  };
}

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore
    await createUserProfile(user.uid, {
      email: user.email!,
      displayName: displayName || null,
      photoURL: user.photoURL || null,
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || 'Sign in failed');
  }
};

/**
 * Sign in with Google (uses popup for faster login)
 */
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

/**
 * Handle redirect result (call this on page load) - kept for compatibility
 */
export const handleGoogleRedirectResult = async (): Promise<User | null> => {
  return null; // Using popup now, no redirect to handle
};

/**
 * Sign in with GitHub
 */
export const signInWithGithub = async (): Promise<User> => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists, create if not
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await createUserProfile(user.uid, {
        email: user.email!,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      });
    }

    return user;
  } catch (error: any) {
    throw new Error(error.message || 'GitHub sign in failed');
  }
};

/**
 * Sign out current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Sign out failed');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Password reset failed');
  }
};

/**
 * Update user password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error: any) {
    throw new Error(error.message || 'Password update failed');
  }
};

/**
 * Create user profile in Firestore
 */
const createUserProfile = async (
  uid: string,
  userData: {
    email: string;
    displayName: string | null;
    photoURL: string | null;
  }
): Promise<void> => {
  const userProfile: Omit<UserProfile, 'uid'> = {
    email: userData.email,
    displayName: userData.displayName,
    photoURL: userData.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    subscription: {
      plan: 'free',
      status: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    usage: {
      scansThisMonth: 0,
      scansLimit: 10, // Free plan limit
      lastResetDate: serverTimestamp(),
    },
    settings: {
      emailNotifications: true,
      reportLanguage: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    gdpr: {
      consentGiven: false,
      consentDate: null,
      dataProcessingAllowed: false,
      marketingConsent: false,
    },
  };

  await setDoc(doc(db, 'users', uid), userProfile);
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        uid: userSnap.id,
        ...userSnap.data(),
      } as UserProfile;
    }

    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user profile');
  }
};

/**
 * Get current user ID token
 */
export const getIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    return null;
  }
};
