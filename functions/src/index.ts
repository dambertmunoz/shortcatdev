import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Import route handlers
import authRoutes from './auth/routes';
import userRoutes from './users/routes';
import requirementRoutes from './requirements/routes';

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/requirements', requirementRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);

// Export individual functions
export * from './auth/functions';
export * from './users/functions';
export * from './requirements/functions';
