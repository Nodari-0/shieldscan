/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { performSecurityScan, ScanResult } from './scanner/securityScanner';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Security Scanner Cloud Function
 * Performs real security checks on a target URL
 */
export const scanWebsite = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB',
  })
  .https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set(corsHeaders);
      res.status(204).send('');
      return;
    }

    res.set(corsHeaders);

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { url, userId } = req.body;

      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      // Validate URL
      let targetUrl: string;
      try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          targetUrl = 'https://' + url;
        } else {
          targetUrl = url;
        }
        new URL(targetUrl);
      } catch {
        res.status(400).json({ error: 'Invalid URL format' });
        return;
      }

      console.log(`[SCAN] Starting scan for: ${targetUrl}`);

      // Perform the security scan
      const scanResult: ScanResult = await performSecurityScan(targetUrl);

      // Store in Firestore if userId provided
      if (userId) {
        try {
          const scanDoc = {
            userId,
            url: targetUrl,
            result: scanResult,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          const docRef = await db.collection('scans').add(scanDoc);
          (scanResult as any).scanId = docRef.id;

          // Update user's scan count
          await db.collection('users').doc(userId).update({
            totalScans: admin.firestore.FieldValue.increment(1),
            lastScanAt: admin.firestore.FieldValue.serverTimestamp(),
          }).catch(() => {
            // User doc might not exist, that's ok
          });
        } catch (dbError) {
          console.error('Error saving to Firestore:', dbError);
          // Continue anyway - scan completed successfully
        }
      }

      console.log(`[SCAN] Completed scan for: ${targetUrl} - Score: ${scanResult.score}`);

      res.status(200).json({
        success: true,
        data: scanResult,
      });
    } catch (error) {
      console.error('[SCAN] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      });
    }
  });

/**
 * Get scan history for a user
 */
export const getScanHistory = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const scansSnapshot = await db
      .collection('scans')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const scans = scansSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      data: scans,
    });
  } catch (error) {
    console.error('[HISTORY] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch history',
    });
  }
});

/**
 * Get a single scan result by ID
 */
export const getScanResult = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const scanId = req.query.scanId as string;

    if (!scanId) {
      res.status(400).json({ error: 'scanId is required' });
      return;
    }

    const scanDoc = await db.collection('scans').doc(scanId).get();

    if (!scanDoc.exists) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: scanDoc.id,
        ...scanDoc.data(),
      },
    });
  } catch (error) {
    console.error('[GET_SCAN] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scan',
    });
  }
});
