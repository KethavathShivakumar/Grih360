import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

// Protect all verification endpoints with JWT authentication
router.use(authenticateToken);

// Tenant view & submit verification
router.get('/tenant/:tenantId', VerificationController.getTenantVerification);
router.get('/me', VerificationController.getTenantVerification);
router.post('/', authorizeRoles('TENANT'), VerificationController.submitVerification);

// Admin verification review queue & status update
router.get('/admin/queue', authorizeRoles('ADMIN'), VerificationController.getAdminQueue);
router.patch('/admin/:tenantId/review', authorizeRoles('ADMIN'), VerificationController.reviewVerification);

export default router;
