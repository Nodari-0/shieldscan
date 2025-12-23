import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const db = admin.firestore();

interface CreateScanRequest {
  targetUrl: string;
}

export const createScan = async (
  data: CreateScanRequest,
  context: functions.https.CallableContext
) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { targetUrl } = data;

  if (!targetUrl) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetUrl is required'
    );
  }

  // Validate and normalize URL
  let normalizedUrl: string;
  try {
    let url = targetUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const urlObj = new URL(url);
    normalizedUrl = urlObj.origin;
  } catch (error) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid URL format'
    );
  }

  // Check user scan limits
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  const usage = userData?.usage || {};
  const scansThisMonth = usage.scansThisMonth || 0;
  const scansLimit = usage.scansLimit || 10;

  // Check if limit exceeded (unless unlimited)
  if (scansLimit !== -1 && scansThisMonth >= scansLimit) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Scan limit exceeded. Please upgrade your plan.'
    );
  }

  // Create scan document
  const scanId = uuidv4();
  await db.collection('scans').doc(scanId).set({
    scanId,
    userId,
    targetUrl: normalizedUrl,
    status: 'pending',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Increment usage
  await userDoc.ref.update({
    'usage.scansThisMonth': admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Trigger scan execution (fire and forget)
  executeScan({ scanId }, { auth: context.auth } as any).catch((error) => {
    functions.logger.error(`Scan ${scanId} execution failed:`, error);
  });

  return { scanId, status: 'pending' };
};

// Import executeScan function
import { executeScan } from './executeScan';
