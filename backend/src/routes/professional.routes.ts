import { Router } from 'express';
import { ProfessionalController } from '../controllers/professional.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticateToken, ProfessionalController.getMyProfile);
router.patch('/me', authenticateToken, ProfessionalController.updateMyProfile);
router.patch('/me/availability', authenticateToken, ProfessionalController.toggleAvailability);
router.get('/me/dashboard', authenticateToken, ProfessionalController.getDashboard);
router.get('/me/requests', authenticateToken, ProfessionalController.getAssignedRequests);
router.get('/me/reviews', authenticateToken, ProfessionalController.getMyReviews);
router.get('/:id/reviews', ProfessionalController.getProfessionalReviews);

export default router;
