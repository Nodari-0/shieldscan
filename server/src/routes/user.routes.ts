/**
 * User Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getFirestoreDB } from '../config/firebase.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const db = getFirestoreDB();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        uid: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile',
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { displayName, settings } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const db = getFirestoreDB();
    const updates: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updates.displayName = displayName;
    }

    if (settings !== undefined) {
      updates.settings = settings;
    }

    await db.collection('users').doc(userId).update(updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
    });
  }
});

/**
 * GET /api/user/usage
 * Get user usage statistics
 */
router.get('/usage', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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
    const subscription = userData?.subscription || {};

    res.json({
      success: true,
      data: {
        scansThisMonth: usage.scansThisMonth || 0,
        scansLimit: usage.scansLimit || 10,
        plan: subscription.plan || 'free',
        subscriptionStatus: subscription.status || 'active',
      },
    });
  } catch (error: any) {
    logger.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage',
    });
  }
});

/**
 * PUT /api/user/settings
 * Update user settings
 */
router.put('/settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { emailNotifications, reportLanguage, timezone } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const db = getFirestoreDB();
    const updates: any = {
      'settings.emailNotifications': emailNotifications,
      'settings.reportLanguage': reportLanguage || 'en',
      'settings.timezone': timezone,
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userId).update(updates);

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update settings',
    });
  }
});

export default router;
