import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

// Protect all verification endpoints with JWT authentication
router.use(authenticateToken);

// Application-centric dedicated verification workflow
router.get('/application/:applicationId', VerificationController.getByApplicationId);
router.post(
  '/application/:applicationId/submit',
  authorizeRoles('TENANT', 'ADMIN'),
  VerificationController.submitForApplication
);
router.post(
  '/application/:applicationId/request',
  authorizeRoles('OWNER', 'ADMIN'),
  VerificationController.requestForApplication
);

// Admin dedicated verification queue & review
router.get('/admin/queue', authorizeRoles('ADMIN'), VerificationController.getAdminQueue);
router.patch('/:id/review', authorizeRoles('ADMIN'), VerificationController.reviewVerification);
router.patch('/admin/:tenantId/review', authorizeRoles('ADMIN'), VerificationController.reviewVerification);

// Single record inspection
router.get('/:id', VerificationController.getById);

// Real document file upload & serving (Tenant or Admin ONLY)
router.post('/upload-document', authorizeRoles('TENANT', 'ADMIN'), VerificationController.uploadDocumentFile);
router.get('/document/:storageKey', authorizeRoles('TENANT', 'ADMIN'), VerificationController.serveDocumentFile);

// Legacy routes for backwards compatibility
router.get('/tenant/:tenantId', VerificationController.getTenantVerification);
router.get('/me', VerificationController.getTenantVerification);
router.post('/', authorizeRoles('TENANT'), VerificationController.submitVerification);

export default router;
