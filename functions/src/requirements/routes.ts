import { Router } from 'express';
import * as requirementController from './controller';
import { validateRequest, validateFirebaseIdToken, checkRole } from '../common/middleware';

const router = Router();

// Apply Firebase token validation to all routes
router.use(validateFirebaseIdToken);

// Requirements routes
router.get('/', requirementController.getRequirements);
router.get('/:id', requirementController.getRequirementById);
router.post('/', validateRequest, requirementController.createRequirement);
router.put('/:id', validateRequest, requirementController.updateRequirement);
router.delete('/:id', requirementController.deleteRequirement);

// Requirement items routes
router.get('/:id/items', requirementController.getRequirementItems);
router.post('/:id/items', validateRequest, requirementController.addRequirementItem);
router.put('/:id/items/:itemId', validateRequest, requirementController.updateRequirementItem);
router.delete('/:id/items/:itemId', requirementController.deleteRequirementItem);

// Requirement approval routes
router.get('/:id/approvals', requirementController.getRequirementApprovals);
router.post('/:id/approvals', validateRequest, checkRole(['administrator', 'buyer']), requirementController.addRequirementApproval);
router.put('/:id/submit', validateRequest, requirementController.submitRequirementForApproval);
router.put('/:id/approve', validateRequest, checkRole(['administrator']), requirementController.approveRequirement);
router.put('/:id/reject', validateRequest, checkRole(['administrator']), requirementController.rejectRequirement);
router.put('/:id/cancel', validateRequest, requirementController.cancelRequirement);
router.put('/:id/complete', validateRequest, requirementController.completeRequirement);

export default router;
