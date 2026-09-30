import { Router } from 'express';
import { RentalController } from '../controllers/rental.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', RentalController.getRentals);
router.get('/property/:propertyId', authorizeRoles('OWNER', 'ADMIN'), RentalController.getRentalByPropertyId);
router.get('/property/:propertyId/tenant', authorizeRoles('OWNER', 'ADMIN'), RentalController.getTenantDetailsForProperty);
router.get('/property/:propertyId/rent', authorizeRoles('OWNER', 'TENANT', 'ADMIN'), RentalController.getRentRecordsForProperty);
router.post('/property/:propertyId/pay', authorizeRoles('TENANT', 'ADMIN'), RentalController.payRent);
router.post('/:id/pay', authorizeRoles('TENANT', 'ADMIN'), RentalController.payRent);
router.get('/:id', RentalController.getRentalById);
router.post('/:id/activate', authorizeRoles('OWNER', 'ADMIN'), RentalController.activateRental);
router.post('/:id/terminate', authorizeRoles('OWNER', 'ADMIN'), RentalController.terminateRental);

export default router;
