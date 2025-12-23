import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import logger from '../utils/logger.js';

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebaseAdmin = (): void => {
  if (initialized) {
    logger.warn('Firebase Admin already initialized');
    return;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Missing Firebase Admin configuration. Please check environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    initialized = true;
    logger.info('Firebase Admin initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): admin.auth.Auth => {
  if (!initialized) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return getAuth();
};

/**
 * Get Firestore instance
 */
export const getFirestoreDB = (): admin.firestore.Firestore => {
  if (!initialized) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return getFirestore();
};

/**
 * Get Firebase Storage instance
 */
export const getFirebaseStorage = (): admin.storage.Storage => {
  if (!initialized) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return getStorage();
};

/**
 * Verify Firebase ID token
 */
export const verifyIdToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const auth = getFirebaseAuth();
    return await auth.verifyIdToken(token);
  } catch (error: any) {
    logger.error('Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Set custom claims on user
 */
export const setCustomClaims = async (
  uid: string,
  claims: Record<string, any>
): Promise<void> => {
  try {
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, claims);
    logger.info(`Custom claims set for user ${uid}`);
  } catch (error: any) {
    logger.error('Failed to set custom claims:', error.message);
    throw error;
  }
};

/**
 * Get user by UID
 */
export const getUserByUid = async (uid: string): Promise<admin.auth.UserRecord> => {
  try {
    const auth = getFirebaseAuth();
    return await auth.getUser(uid);
  } catch (error: any) {
    logger.error('Failed to get user:', error.message);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const auth = getFirebaseAuth();
    await auth.deleteUser(uid);
    logger.info(`User ${uid} deleted`);
  } catch (error: any) {
    logger.error('Failed to delete user:', error.message);
    throw error;
  }
};
