import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', authorizeRoles('TENANT'), ApplicationController.submitApplication);
router.get('/', ApplicationController.listApplications);
router.get('/:id', ApplicationController.getApplicationById);
router.patch('/:id/status', authorizeRoles('OWNER', 'ADMIN', 'TENANT'), ApplicationController.updateStatus);

export default router;
