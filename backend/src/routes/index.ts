import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import propertyRoutes from './property.routes';
import applicationRoutes from './application.routes';
import rentalRoutes from './rental.routes';
import serviceRoutes from './service.routes';
import professionalRoutes from './professional.routes';
import notificationRoutes from './notification.routes';
import ownerRoutes from './owner.routes';
import adminRoutes from './admin.routes';
import verificationRoutes from './verification.routes';
import agreementRoutes from './agreement.routes';
import healthRoutes from './health.routes';
import locationRoutes from './location.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/applications', applicationRoutes);
router.use('/rentals', rentalRoutes);
router.use('/services', serviceRoutes);
router.use('/professionals', professionalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/owner', ownerRoutes);
router.use('/admin', adminRoutes);
router.use('/verifications', verificationRoutes);
router.use('/agreements', agreementRoutes);
router.use('/locations', locationRoutes);
router.use('/health', healthRoutes);

export default router;

