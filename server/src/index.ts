import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initializeFirebaseAdmin } from './config/firebase.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import scanRoutes from './routes/scan.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import userRoutes from './routes/user.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Stripe webhook route (must be before JSON middleware to receive raw body)
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const Stripe = await import('stripe');
      const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2023-10-16',
      });
      
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      
      const { handleWebhookEvent } = await import('./services/subscription.service.js');
      await handleWebhookEvent(event);
      
      res.json({ received: true });
    } catch (err: any) {
      logger.error('Webhook error:', err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }
);

// JSON body parsing (after webhook route)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;