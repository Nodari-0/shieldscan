/**
 * Scan Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { scanRateLimiter } from '../middleware/rateLimiter.js';
import { createScan, getScanStatus } from '../services/scan.service.js';
import { getFirestoreDB } from '../config/firebase.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/scans
 * Create a new scan
 */
router.post('/', authenticateToken, scanRateLimiter, async (req: Request, res: Response) => {
  try {
    const { targetUrl } = req.body;
    const userId = req.user?.uid;

    if (!userId || !targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check user scan limits
    const db = getFirestoreDB();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();
    const usage = userData?.usage || {};
    const scansThisMonth = usage.scansThisMonth || 0;
    const scansLimit = usage.scansLimit || 10;

    // Check if limit exceeded (unless unlimited)
    if (scansLimit !== -1 && scansThisMonth >= scansLimit) {
      return res.status(403).json({
        success: false,
        error: 'Scan limit exceeded. Please upgrade your plan.',
      });
    }

    // Create scan
    const scanId = await createScan({
      targetUrl,
      userId,
    });

    // Increment usage
    await userDoc.ref.update({
      'usage.scansThisMonth': scansThisMonth + 1,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      data: { scanId },
    });
  } catch (error: any) {
    logger.error('Create scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create scan',
    });
  }
});

/**
 * GET /api/scans
 * List user's scans
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const db = getFirestoreDB();
    const scansSnapshot = await db.collection('scans')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const scans = scansSnapshot.docs.map(doc => ({
      scanId: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      data: scans,
    });
  } catch (error: any) {
    logger.error('List scans error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list scans',
    });
  }
});

/**
 * GET /api/scans/:id
 * Get scan details
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const scan = await getScanStatus(id);

    // Verify ownership
    if (scan.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: scan,
    });
  } catch (error: any) {
    logger.error('Get scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get scan',
    });
  }
});

/**
 * GET /api/scans/:id/report
 * Download PDF report
 */
router.get('/:id/report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const scan = await getScanStatus(id);

    // Verify ownership
    if (scan.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Return report URL if exists
    if (scan.reportUrl) {
      res.json({
        success: true,
        data: { url: scan.reportUrl },
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Report not available',
      });
    }
  } catch (error: any) {
    logger.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get report',
    });
  }
});

export default router;