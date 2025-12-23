import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase.js';
import logger from '../utils/logger.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        subscriptionPlan?: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to verify Firebase ID token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Invalid token format' });
      return;
    }

    // Verify the token
    const decodedToken = await verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      subscriptionPlan: decodedToken.subscriptionPlan,
      role: decodedToken.role,
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error.message);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const userRole = req.user.role || 'user';

    if (!roles.includes(userRole)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has required subscription plan
 */
export const requireSubscription = (...plans: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const userPlan = req.user.subscriptionPlan || 'free';

    if (!plans.includes(userPlan)) {
      res.status(403).json({
        success: false,
        error: 'This feature requires a higher subscription plan',
      });
      return;
    }

    next();
  };
};
