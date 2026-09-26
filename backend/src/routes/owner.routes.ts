import { Router } from 'express';
import { OwnerController } from '../controllers/owner.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('OWNER', 'ADMIN'));

router.get('/dashboard', OwnerController.getDashboard);

export default router;
