import { Router } from 'express';
import { AgreementController } from '../controllers/agreement.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);

// Get agreement by rental ID
router.get('/rental/:rentalId', AgreementController.getAgreement);

// Owner confirms agreement
router.patch('/rental/:rentalId/confirm', authorizeRoles('OWNER', 'ADMIN'), AgreementController.confirmAgreement);

export default router;
