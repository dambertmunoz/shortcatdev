import { Router } from 'express';
import * as authController from './controller';
import { validateRequest } from '../common/middleware';

const router = Router();

// Auth routes
router.post('/register', validateRequest, authController.register);
router.post('/login', validateRequest, authController.login);
router.post('/setup-2fa', validateRequest, authController.setupTwoFactor);
router.post('/verify-2fa', validateRequest, authController.verifyTwoFactor);
router.post('/reset-password', validateRequest, authController.resetPassword);
router.post('/update-profile', validateRequest, authController.updateProfile);

export default router;
