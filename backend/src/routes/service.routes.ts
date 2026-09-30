import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public route for service categories
router.get('/categories', ServiceController.getCategories);

// Authenticated service request routes
router.get('/requests', authenticateToken, ServiceController.getUserRequests);
router.get('/properties/:propertyId', authenticateToken, ServiceController.getPropertyServiceRequests);
router.post('/requests', authenticateToken, ServiceController.createServiceRequest);
router.get('/requests/:id', authenticateToken, ServiceController.getRequestById);
router.patch('/requests/:id/status', authenticateToken, ServiceController.updateRequestStatus);
router.post('/requests/:id/cancel', authenticateToken, ServiceController.cancelServiceRequest);
router.post('/requests/:id/images', authenticateToken, ServiceController.uploadServiceImages);
router.get('/requests/:id/reviews', authenticateToken, ServiceController.getServiceReviews);
router.post('/requests/:id/review', authenticateToken, ServiceController.submitServiceReview);

export default router;
