import { Router } from 'express';
import { AgreementController } from '../controllers/agreement.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);

// Get all agreements for current user (Tenant or Owner)
router.get('/', AgreementController.getAgreements);

// Get agreement by rental ID
router.get('/rental/:rentalId', AgreementController.getAgreement);

// Get agreement by ID
router.get('/:id', AgreementController.getAgreementById);

// Tenant confirms agreement
router.patch('/rental/:rentalId/tenant-confirm', authorizeRoles('TENANT', 'ADMIN'), AgreementController.tenantConfirmAgreement);
router.patch('/:id/tenant-confirm', authorizeRoles('TENANT', 'ADMIN'), AgreementController.tenantConfirmAgreement);

// Owner confirms agreement & activates rental
router.patch('/rental/:rentalId/confirm', authorizeRoles('OWNER', 'ADMIN'), AgreementController.confirmAgreement);
router.patch('/:id/confirm', authorizeRoles('OWNER', 'ADMIN'), AgreementController.confirmAgreement);

// Cancel agreement
router.patch('/rental/:rentalId/cancel', authorizeRoles('OWNER', 'TENANT', 'ADMIN'), AgreementController.cancelAgreement);
router.patch('/:id/cancel', authorizeRoles('OWNER', 'TENANT', 'ADMIN'), AgreementController.cancelAgreement);

export default router;

