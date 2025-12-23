/**
 * Migration Script: Update existing users to new pricing structure
 * 
 * Run this script once to migrate all existing users from old plan structure
 * to the new pricing system:
 * - 'ultra' → 'business' (100 scans/month)
 * - 'pro' → 'pro' (updated to 40 scans/month from 100)
 * - 'free' → 'free' (1 scan/month, unchanged)
 * 
 * Prerequisites:
 * 1. Install firebase-admin: npm install firebase-admin --save-dev
 * 2. Download service account key from Firebase Console
 * 3. Save as serviceAccountKey.json in project root
 * 
 * Usage:
 * 1. Ensure you're in the client directory
 * 2. Run: npx tsx src/scripts/migratePlans.ts
 * 
 * Or use Firebase CLI:
 * firebase functions:shell
 * > migratePlans()
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Try to find service account key
    const possiblePaths = [
      path.join(process.cwd(), 'serviceAccountKey.json'),
      path.join(process.cwd(), '..', 'serviceAccountKey.json'),
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
    ];

    let serviceAccount;
    for (const keyPath of possiblePaths) {
      if (keyPath && fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        break;
      }
    }

    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (!serviceAccount) {
      throw new Error(
        'Firebase Admin not initialized. Provide serviceAccountKey.json or set FIREBASE_SERVICE_ACCOUNT env var.'
      );
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

interface UserProfile {
  uid: string;
  email: string;
  plan: 'free' | 'pro' | 'ultra' | 'business' | 'enterprise';
  scansUsed: number;
  scansLimit: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
}

/**
 * Migration logic for plan updates
 */
function getNewPlanConfig(oldPlan: string): {
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  scansLimit: number;
} {
  switch (oldPlan) {
    case 'ultra':
      // Migrate ultra to business
      return {
        plan: 'business',
        scansLimit: 100, // 99 + 1 free
      };
    case 'pro':
      // Update pro limits
      return {
        plan: 'pro',
        scansLimit: 40, // 39 + 1 free (was 100)
      };
    case 'business':
    case 'enterprise':
      // Already on new structure, keep as is
      return {
        plan: oldPlan as 'business' | 'enterprise',
        scansLimit: oldPlan === 'business' ? 100 : -1, // Enterprise keeps custom limits
      };
    case 'free':
    default:
      // Free plan unchanged
      return {
        plan: 'free',
        scansLimit: 1,
      };
  }
}

/**
 * Main migration function
 */
export async function migratePlans() {
  console.log('🚀 Starting plan migration...\n');

  const db = initializeFirebaseAdmin();
  const usersRef = db.collection('users');

  try {
    // Get all users
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('✅ No users found. Migration complete.');
      return;
    }

    console.log(`📊 Found ${snapshot.size} users to migrate\n`);

    const migrations = {
      ultra: 0,
      pro: 0,
      free: 0,
      unchanged: 0,
      errors: 0,
    };

    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    for (const doc of snapshot.docs) {
      try {
        const userData = doc.data() as UserProfile;
        const oldPlan = userData.plan || 'free';
        const newConfig = getNewPlanConfig(oldPlan);

        // Only update if plan or limit changed
        const needsUpdate =
          oldPlan !== newConfig.plan ||
          userData.scansLimit !== newConfig.scansLimit;

        if (needsUpdate) {
          const userRef = usersRef.doc(doc.id);

          // Preserve existing scansUsed, but reset if plan changed
          const updates: any = {
            plan: newConfig.plan,
            scansLimit: newConfig.scansLimit,
            updatedAt: new Date(),
            migratedAt: new Date(),
            migrationNote: `Migrated from ${oldPlan} to ${newConfig.plan}`,
          };

          // If plan changed, reset scan count (fair migration)
          if (oldPlan !== newConfig.plan) {
            updates.scansUsed = 0;
            updates.lastScanResetAt = new Date();
            console.log(
              `  📝 ${userData.email}: ${oldPlan} → ${newConfig.plan} (resetting scans)`
            );
          } else {
            // Only limit changed, keep scansUsed but cap it
            if (userData.scansUsed > newConfig.scansLimit) {
              updates.scansUsed = newConfig.scansLimit;
              console.log(
                `  📝 ${userData.email}: Updated limit ${userData.scansLimit} → ${newConfig.scansLimit} (capped scans)`
              );
            } else {
              console.log(
                `  📝 ${userData.email}: Updated limit ${userData.scansLimit} → ${newConfig.scansLimit}`
              );
            }
          }

          batch.update(userRef, updates);
          batchCount++;

          // Track migration stats
          if (oldPlan === 'ultra') migrations.ultra++;
          else if (oldPlan === 'pro') migrations.pro++;
          else if (oldPlan === 'free') migrations.free++;
          else migrations.unchanged++;

          // Commit batch if limit reached
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`  ✅ Committed batch of ${batchCount} updates\n`);
            batchCount = 0;
          }
        } else {
          migrations.unchanged++;
          console.log(`  ⏭️  ${userData.email}: No changes needed (${oldPlan})`);
        }
      } catch (error) {
        migrations.errors++;
        console.error(`  ❌ Error migrating user ${doc.id}:`, error);
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Committed final batch of ${batchCount} updates\n`);
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`Ultra → Business: ${migrations.ultra}`);
    console.log(`Pro (limit updated): ${migrations.pro}`);
    console.log(`Free (no changes): ${migrations.free}`);
    console.log(`Unchanged: ${migrations.unchanged}`);
    console.log(`Errors: ${migrations.errors}`);
    console.log(`Total processed: ${snapshot.size}`);
    console.log('='.repeat(50));
    console.log('\n✅ Migration complete!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  migratePlans()
    .then(() => {
      console.log('Migration script completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

