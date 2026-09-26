import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';

const router = Router();

// Public Property Endpoints
router.get('/', ValidationMiddleware.validateCoordinates, PropertyController.searchProperties);
router.get('/my/listings', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), PropertyController.getMyProperties);
router.get('/my/saved', authenticateToken, authorizeRoles('TENANT'), PropertyController.getSavedProperties);
router.get('/:id', ValidationMiddleware.validateObjectIdParam('id'), PropertyController.getPropertyById);

// Owner / Admin Property Creation, Edit, Delete, Images
router.post('/', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateCoordinates, PropertyController.createProperty);
router.patch('/:id', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateObjectIdParam('id'), ValidationMiddleware.validateCoordinates, PropertyController.updateProperty);
router.delete('/:id', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.deleteProperty);
router.post('/:id/images', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.addImages);
router.patch('/:id/images/main/:imageIndex', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.setMainImage);
router.delete('/:id/images/:imageIndex', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.deleteImage);
router.patch('/:id/images/reorder', authenticateToken, authorizeRoles('OWNER', 'ADMIN'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.reorderImages);

// Tenant Saved Properties Actions
router.post('/:id/save', authenticateToken, authorizeRoles('TENANT'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.saveProperty);
router.delete('/:id/save', authenticateToken, authorizeRoles('TENANT'), ValidationMiddleware.validateObjectIdParam('id'), PropertyController.unsaveProperty);

export default router;
