import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  increment,
  addDoc
} from 'firebase/firestore';
import { db } from './config';
import { User } from 'firebase/auth';

// ==========================================
// TYPES
// ==========================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  scansUsed: number;
  scansLimit: number;
  lastScanResetAt?: Timestamp | Date; // Track when scan count was last reset (monthly)
  lastScanAt?: Timestamp | Date; // Track last scan time for cooldown
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastLoginAt: Timestamp | Date;
  provider: string;
  isAdmin: boolean;
  // Team management (business/enterprise only)
  teamId?: string; // If user belongs to a team
  teamRole?: 'owner' | 'member'; // Team role
  // Enterprise custom limits
  customScanLimit?: number; // For enterprise plans
}

export interface ScanRecord {
  id?: string;
  userId: string;
  userEmail: string;
  url: string;
  score: number;
  grade: string;
  checksCount: number;
  passed: number;
  warnings: number;
  failed: number;
  duration: number;
  tags?: string[]; // Custom tags for organization
  scheduledScanId?: string; // If this was a scheduled scan
  createdAt: Timestamp | Date;
}

export interface SubscriptionEvent {
  id?: string;
  userId: string;
  userEmail: string;
  type: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 'payment_succeeded' | 'payment_failed';
  stripeEventId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  plan?: string;
  amount?: number;
  currency?: string;
  createdAt: Timestamp | Date;
}

export interface ScheduledScan {
  id?: string;
  userId: string;
  userEmail: string;
  url: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRunAt?: Timestamp | Date;
  nextRunAt: Timestamp | Date;
  createdAt: Timestamp | Date;
  tags?: string[];
  notifyEmail?: boolean;
}

export interface Testimonial {
  id?: string;
  userId: string;
  userEmail: string;
  authorName: string;
  authorPhotoURL: string | null;
  rating: number; // 1-5 stars
  message: string;
  approved: boolean; // Admin approval before showing
  createdAt: Timestamp | Date;
}

import { ADMIN_EMAILS } from '@/config/admin';

// ==========================================
// USER FUNCTIONS
// ==========================================

/**
 * Create or update user profile in Firestore
 */
export async function createOrUpdateUser(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  const isAdmin = ADMIN_EMAILS.some(
    email => email.toLowerCase() === user.email?.toLowerCase()
  );

  if (userSnap.exists()) {
    // Update existing user
    const currentData = userSnap.data();
    const currentProvider = user.providerData?.[0]?.providerId;
    
    const updates: Record<string, any> = {
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAdmin,
      // If admin, upgrade to business (enterprise-like)
      ...(isAdmin && { plan: 'business', scansLimit: -1 }),
      // Update provider if it was unknown or missing
      ...((currentProvider && (!currentData.provider || currentData.provider === 'unknown')) && { provider: currentProvider }),
    };
    
    await updateDoc(userRef, updates);
    
    const updatedSnap = await getDoc(userRef);
    return updatedSnap.data() as UserProfile;
  } else {
    // Create new user
    const newUser: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
      lastLoginAt: ReturnType<typeof serverTimestamp>;
    } = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      plan: isAdmin ? 'business' : 'free',
      scansUsed: 0,
      scansLimit: isAdmin ? -1 : 1,
      lastScanResetAt: serverTimestamp(), // Initialize reset date
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      provider: user.providerData?.[0]?.providerId || 'unknown',
      isAdmin,
    };

    await setDoc(userRef, newUser);
    
    const createdSnap = await getDoc(userRef);
    return createdSnap.data() as UserProfile;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    // Don't use orderBy to avoid requiring Firestore index
    const snapshot = await getDocs(usersRef);
    
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    
    // Sort client-side instead
    users.sort((a, b) => {
      const dateA = (a.createdAt as Timestamp)?.toDate?.()?.getTime() || 0;
      const dateB = (b.createdAt as Timestamp)?.toDate?.()?.getTime() || 0;
      return dateB - dateA; // Descending
    });
    
    console.log(`getAllUsers: Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Check and reset scan count if new month (monthly reset)
 */
function shouldResetScanCount(lastResetAt: Timestamp | Date | undefined): boolean {
  if (!lastResetAt) return true; // First time, reset needed
  
  const lastReset = lastResetAt instanceof Timestamp 
    ? lastResetAt.toDate() 
    : new Date(lastResetAt);
  
  const now = new Date();
  
  // Check if we're in a different month
  return lastReset.getMonth() !== now.getMonth() || 
         lastReset.getFullYear() !== now.getFullYear();
}

/**
 * Update user's scan count with monthly reset logic
 */
export async function incrementUserScanCount(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User not found for scan increment');
      return;
    }
    
    const userData = userSnap.data() as UserProfile;
    const needsReset = shouldResetScanCount(userData.lastScanResetAt);
    
    if (needsReset) {
      // Reset scan count for new month
      await updateDoc(userRef, {
        scansUsed: 1, // Start with 1 (current scan)
        lastScanResetAt: serverTimestamp(),
        lastScanAt: serverTimestamp(), // Track scan time for cooldown
        updatedAt: serverTimestamp(),
      });
    } else {
      // Increment existing count
      await updateDoc(userRef, {
        scansUsed: increment(1),
        lastScanAt: serverTimestamp(), // Track scan time for cooldown
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error incrementing scan count:', error);
  }
}

/**
 * Get scan limit for a plan
 */
function getPlanScanLimit(plan: 'free' | 'pro' | 'business' | 'enterprise', customLimit?: number): number {
  switch (plan) {
    case 'free':
      return 1;
    case 'pro':
      return 40; // 39 + 1 free
    case 'business':
      return 100; // 99 + 1 free
    case 'enterprise':
      return customLimit || -1; // Custom limit or unlimited
    default:
      return 1;
  }
}

/**
 * Update user subscription (called by Stripe webhook)
 */
export async function updateUserSubscription(
  uid: string,
  data: {
    plan: 'free' | 'pro' | 'business' | 'enterprise';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
    customScanLimit?: number; // For enterprise
  }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Get current user to preserve custom limits for enterprise
    const userSnap = await getDoc(userRef);
    const currentUser = userSnap.data() as UserProfile | undefined;
    
    const scansLimit = getPlanScanLimit(data.plan, data.customScanLimit || currentUser?.customScanLimit);
    
    const updateData: any = {
      plan: data.plan,
      scansLimit,
      updatedAt: serverTimestamp(),
    };
    
    // Only reset scansUsed if upgrading/downgrading (not on status change)
    if (currentUser?.plan !== data.plan) {
      updateData.scansUsed = 0;
      updateData.lastScanResetAt = serverTimestamp();
    }
    
    // Update subscription fields if provided
    if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;
    if (data.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = data.stripeSubscriptionId;
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.customScanLimit !== undefined) updateData.customScanLimit = data.customScanLimit;
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Check if user can perform a scan (rate limit + scan limit)
 */
export async function canUserScan(uid: string): Promise<{
  allowed: boolean;
  reason?: string;
  scansRemaining: number;
  resetDate?: Date;
}> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { allowed: false, reason: 'User not found', scansRemaining: 0 };
    }
    
    const user = userSnap.data() as UserProfile;
    
    // Check monthly reset
    const needsReset = shouldResetScanCount(user.lastScanResetAt);
    if (needsReset) {
      // Reset scan count
      await updateDoc(userRef, {
        scansUsed: 0,
        lastScanResetAt: serverTimestamp(),
      });
      
      return {
        allowed: true,
        scansRemaining: user.scansLimit === -1 ? -1 : user.scansLimit,
      };
    }
    
    // Check scan limit
    if (user.scansLimit === -1) {
      // Unlimited (enterprise)
      return { allowed: true, scansRemaining: -1 };
    }
    
    if (user.scansUsed >= user.scansLimit) {
      // Calculate next reset date
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1);
      resetDate.setDate(1);
      
      return {
        allowed: false,
        reason: 'Monthly scan limit reached. Please upgrade your plan.',
        scansRemaining: 0,
        resetDate,
      };
    }
    
    // Check cooldown (prevent rapid scanning)
    if (user.lastScanAt) {
      const lastScan = user.lastScanAt instanceof Timestamp 
        ? user.lastScanAt.toDate() 
        : new Date(user.lastScanAt);
      
      const cooldownSeconds = 5; // 5 second cooldown between scans
      const secondsSinceLastScan = (Date.now() - lastScan.getTime()) / 1000;
      
      if (secondsSinceLastScan < cooldownSeconds) {
        const waitTime = Math.ceil(cooldownSeconds - secondsSinceLastScan);
        return {
          allowed: false,
          reason: `Please wait ${waitTime} second(s) before scanning again.`,
          scansRemaining: user.scansLimit - user.scansUsed,
        };
      }
    }
    
    return {
      allowed: true,
      scansRemaining: user.scansLimit - user.scansUsed,
    };
  } catch (error) {
    console.error('Error checking scan permission:', error);
    return { allowed: false, reason: 'Error checking scan limits', scansRemaining: 0 };
  }
}

/**
 * Find user by Stripe customer ID
 */
export async function findUserByStripeCustomerId(customerId: string): Promise<UserProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('stripeCustomerId', '==', customerId), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserProfile;
  } catch (error) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserProfile;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

/**
 * Update user profile in Firestore (partial update)
 */
export async function updateUserInFirestore(
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log('User profile updated in Firestore');
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    throw error;
  }
}

// ==========================================
// SCAN FUNCTIONS
// ==========================================

/**
 * Save scan record to Firestore
 */
export async function saveScanRecord(scan: Omit<ScanRecord, 'id' | 'createdAt'>): Promise<string> {
  try {
    const scansRef = collection(db, 'scans');
    const docRef = await addDoc(scansRef, {
      ...scan,
      createdAt: serverTimestamp(),
    });
    
    // Also increment user's scan count
    await incrementUserScanCount(scan.userId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving scan record:', error);
    throw error;
  }
}

// ==========================================
// SCHEDULED SCANS
// ==========================================

/**
 * Create a scheduled scan
 */
export async function createScheduledScan(
  scan: Omit<ScheduledScan, 'id' | 'createdAt' | 'nextRunAt'>
): Promise<string> {
  try {
    const scheduledScansRef = collection(db, 'scheduled_scans');
    
    // Calculate next run time based on frequency
    const now = new Date();
    let nextRun = new Date();
    
    switch (scan.frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(9, 0, 0, 0); // 9 AM daily
        break;
      case 'weekly':
        nextRun.setDate(now.getDate() + 7);
        nextRun.setHours(9, 0, 0, 0); // Next Monday 9 AM
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(9, 0, 0, 0); // First of month 9 AM
        break;
    }
    
    const docRef = await addDoc(scheduledScansRef, {
      ...scan,
      nextRunAt: Timestamp.fromDate(nextRun),
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating scheduled scan:', error);
    throw error;
  }
}

/**
 * Get user's scheduled scans
 */
export async function getUserScheduledScans(userId: string): Promise<ScheduledScan[]> {
  try {
    const scheduledScansRef = collection(db, 'scheduled_scans');
    const q = query(
      scheduledScansRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ScheduledScan));
  } catch (error) {
    console.error('Error getting scheduled scans:', error);
    return [];
  }
}

/**
 * Update scheduled scan
 */
export async function updateScheduledScan(
  scanId: string,
  updates: Partial<ScheduledScan>
): Promise<void> {
  try {
    const scanRef = doc(db, 'scheduled_scans', scanId);
    await updateDoc(scanRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating scheduled scan:', error);
    throw error;
  }
}

/**
 * Delete scheduled scan
 */
export async function deleteScheduledScan(scanId: string): Promise<void> {
  try {
    const scanRef = doc(db, 'scheduled_scans', scanId);
    await deleteDoc(scanRef);
  } catch (error) {
    console.error('Error deleting scheduled scan:', error);
    throw error;
  }
}

/**
 * Get user's scan history
 */
export async function getUserScans(userId: string, limitCount: number = 50): Promise<ScanRecord[]> {
  try {
    const scansRef = collection(db, 'scans');
    
    // Try with index first (userId + createdAt)
    try {
      const q = query(
        scansRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ScanRecord));
    } catch (indexError: any) {
      // Fallback: Get all scans and filter client-side if index doesn't exist
      if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
        console.warn('Firestore index missing, using fallback query:', indexError.message);
        const q = query(
          scansRef,
          where('userId', '==', userId),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);
        
        // Sort client-side by createdAt
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ScanRecord));
        
        // Sort by createdAt descending
        results.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
          const bDate = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        
        return results.slice(0, limitCount);
      }
      throw indexError;
    }
  } catch (error) {
    console.error('Error getting user scans:', error);
    return [];
  }
}

/**
 * Get all scans (admin only)
 */
export async function getAllScans(limitCount: number = 100): Promise<ScanRecord[]> {
  try {
    const scansRef = collection(db, 'scans');
    const q = query(scansRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ScanRecord));
  } catch (error) {
    console.error('Error getting all scans:', error);
    return [];
  }
}

// ==========================================
// SUBSCRIPTION/REVENUE FUNCTIONS
// ==========================================

/**
 * Log subscription event (for revenue tracking)
 */
export async function logSubscriptionEvent(event: Omit<SubscriptionEvent, 'id' | 'createdAt'>): Promise<string> {
  try {
    const eventsRef = collection(db, 'subscription_events');
    const docRef = await addDoc(eventsRef, {
      ...event,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging subscription event:', error);
    throw error;
  }
}

/**
 * Get all subscription events (admin only)
 */
export async function getSubscriptionEvents(limitCount: number = 100): Promise<SubscriptionEvent[]> {
  try {
    const eventsRef = collection(db, 'subscription_events');
    const q = query(eventsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SubscriptionEvent));
  } catch (error) {
    console.error('Error getting subscription events:', error);
    return [];
  }
}

/**
 * Calculate revenue stats
 */
export async function getRevenueStats(): Promise<{
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  subscriptionsByPlan: { essential: number; cloud: number; pro: number; enterprise: number };
}> {
  try {
    // Get all users for subscription counts
    const users = await getAllUsers();
    console.log('getRevenueStats: users count =', users.length, 'plans =', users.map(u => u.plan || 'undefined'));
    
    const subscriptionsByPlan = {
      // Count users with no plan, undefined plan, or explicitly 'essential'/'free' as essential users
      essential: users.filter(u => !u.plan || u.plan === 'free' || u.plan === 'essential').length,
      cloud: users.filter(u => u.plan === 'cloud' && u.subscriptionStatus === 'active').length,
      pro: users.filter(u => u.plan === 'pro' && u.subscriptionStatus === 'active').length,
      enterprise: users.filter(u => (u.plan === 'enterprise' || u.plan === 'ultra') && u.subscriptionStatus === 'active' && !u.isAdmin).length,
    };
    
    console.log('getRevenueStats: subscriptionsByPlan =', subscriptionsByPlan);

    // Get payment events - no composite index needed
    const eventsRef = collection(db, 'subscription_events');
    let snapshot;
    try {
      // Try with filter first
      const paymentsQuery = query(
        eventsRef,
        where('type', '==', 'payment_succeeded')
      );
      snapshot = await getDocs(paymentsQuery);
    } catch (e) {
      // Fallback: get all events and filter client-side
      console.log('Fetching all events and filtering client-side');
      const allEventsSnapshot = await getDocs(eventsRef);
      snapshot = {
        docs: allEventsSnapshot.docs.filter(
          doc => doc.data().type === 'payment_succeeded'
        )
      };
    }
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    snapshot.docs.forEach(doc => {
      const event = doc.data() as SubscriptionEvent;
      const amount = event.amount || 0;
      const eventDate = (event.createdAt as Timestamp).toDate();

      totalRevenue += amount;

      if (eventDate >= thisMonthStart) {
        thisMonthRevenue += amount;
      } else if (eventDate >= lastMonthStart && eventDate <= lastMonthEnd) {
        lastMonthRevenue += amount;
      }
    });

    return {
      totalRevenue: totalRevenue / 100, // Stripe amounts are in cents
      thisMonthRevenue: thisMonthRevenue / 100,
      lastMonthRevenue: lastMonthRevenue / 100,
      subscriptionsByPlan,
    };
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    return {
      totalRevenue: 0,
      thisMonthRevenue: 0,
      lastMonthRevenue: 0,
      subscriptionsByPlan: { free: 0, pro: 0, ultra: 0 },
    };
  }
}

// ==========================================
// ADMIN STATS
// ==========================================

/**
 * Get admin dashboard stats
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalScans: number;
  avgScore: number;
  recentUsers: UserProfile[];
  recentScans: ScanRecord[];
}> {
  try {
    const users = await getAllUsers();
    const scans = await getAllScans(100);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activeUsers = users.filter(u => {
      const lastLogin = (u.lastLoginAt as Timestamp)?.toDate?.() || new Date(0);
      return lastLogin >= thirtyDaysAgo;
    }).length;

    const avgScore = scans.length > 0
      ? Math.round(scans.reduce((sum, s) => sum + s.score, 0) / scans.length)
      : 0;

    return {
      totalUsers: users.length,
      activeUsers,
      totalScans: scans.length,
      avgScore,
      recentUsers: users.slice(0, 10),
      recentScans: scans.slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalScans: 0,
      avgScore: 0,
      recentUsers: [],
      recentScans: [],
    };
  }
}

// ==========================================
// TESTIMONIAL FUNCTIONS
// ==========================================

/**
 * Create a new testimonial/review
 */
export async function createTestimonial(
  testimonial: Omit<Testimonial, 'id' | 'createdAt' | 'approved'>
): Promise<string> {
  try {
    const testimonialsRef = collection(db, 'testimonials');
    const newTestimonial: Omit<Testimonial, 'id'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      approved: boolean;
    } = {
      ...testimonial,
      approved: false, // Requires admin approval
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(testimonialsRef, newTestimonial);
    return docRef.id;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
}

/**
 * Get all approved testimonials
 */
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const testimonialsRef = collection(db, 'testimonials');
    
    // Try with orderBy first
    try {
      const q = query(
        testimonialsRef,
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Testimonial[];
    } catch (orderByError: any) {
      // If orderBy fails (missing index), fetch without ordering
      if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
        console.warn('Firestore index missing for approved testimonials, fetching without orderBy');
        const q = query(
          testimonialsRef,
          where('approved', '==', true)
        );
        const snapshot = await getDocs(q);
        const testimonials = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Testimonial[];
        
        // Sort client-side
        testimonials.sort((a, b) => {
          const dateA = (a.createdAt instanceof Date) 
            ? a.createdAt.getTime() 
            : ((a.createdAt as Timestamp)?.toDate?.()?.getTime() || 0);
          const dateB = (b.createdAt instanceof Date)
            ? b.createdAt.getTime()
            : ((b.createdAt as Timestamp)?.toDate?.()?.getTime() || 0);
          return dateB - dateA; // Descending
        });
        
        return testimonials;
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error getting approved testimonials:', error);
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
}

/**
 * Get all testimonials (including unapproved) - Admin only
 */
export async function getAllTestimonials(): Promise<Testimonial[]> {
  try {
    const testimonialsRef = collection(db, 'testimonials');
    
    // Try with orderBy first
    try {
      const q = query(
        testimonialsRef,
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const testimonials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Testimonial[];
      
      console.log(`getAllTestimonials: Found ${testimonials.length} testimonials`);
      return testimonials;
    } catch (orderByError: any) {
      // If orderBy fails (missing index), fetch without ordering
      if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
        console.warn('Firestore index missing for testimonials, fetching without orderBy');
        const snapshot = await getDocs(testimonialsRef);
        const testimonials = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Testimonial[];
        
        // Sort client-side
        testimonials.sort((a, b) => {
          const dateA = (a.createdAt instanceof Date) 
            ? a.createdAt.getTime() 
            : ((a.createdAt as Timestamp)?.toDate?.()?.getTime() || 0);
          const dateB = (b.createdAt instanceof Date)
            ? b.createdAt.getTime()
            : ((b.createdAt as Timestamp)?.toDate?.()?.getTime() || 0);
          return dateB - dateA; // Descending
        });
        
        console.log(`getAllTestimonials (fallback): Found ${testimonials.length} testimonials`);
        return testimonials;
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error getting all testimonials:', error);
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
}

/**
 * Approve a testimonial - Admin only
 */
export async function approveTestimonial(testimonialId: string): Promise<void> {
  try {
    const testimonialRef = doc(db, 'testimonials', testimonialId);
    await updateDoc(testimonialRef, {
      approved: true,
    });
  } catch (error) {
    console.error('Error approving testimonial:', error);
    throw error;
  }
}

/**
 * Delete/reject a testimonial - Admin only
 */
export async function deleteTestimonial(testimonialId: string): Promise<void> {
  try {
    const testimonialRef = doc(db, 'testimonials', testimonialId);
    await deleteDoc(testimonialRef);
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
}

