import { Router } from 'express';
import * as userController from './controller';
import { validateRequest, validateFirebaseIdToken, checkRole } from '../common/middleware';

const router = Router();

// Apply Firebase token validation to all routes
router.use(validateFirebaseIdToken);

// User routes
router.get('/', checkRole(['administrator']), userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validateRequest, userController.updateUser);
router.delete('/:id', checkRole(['administrator']), userController.deleteUser);
router.put('/:id/role', validateRequest, checkRole(['administrator']), userController.updateUserRole);
router.put('/:id/company', validateRequest, userController.updateUserCompany);

export default router;
