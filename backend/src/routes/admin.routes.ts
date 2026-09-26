import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

// Server-side Admin Authentication & Authorization Middleware
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Dashboard Stats & System Health
router.get('/stats', AdminController.getSystemStats);
router.get('/dashboard', AdminController.getSystemStats);
router.get('/system', AdminController.getSystemHealth);

// Users Management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.patch('/users/:id/role', AdminController.updateUserRole);

// Properties Management & Moderation
router.get('/properties', AdminController.getProperties);
router.get('/properties/:id', AdminController.getPropertyById);
router.patch('/properties/:id/status', AdminController.updatePropertyStatus);

// Applications Monitoring
router.get('/applications', AdminController.getApplications);
router.get('/applications/:id', AdminController.getApplicationById);

// Rentals Monitoring
router.get('/rentals', AdminController.getRentals);
router.get('/rentals/:id', AdminController.getRentalById);

// Verifications Management & Review
router.get('/verifications', AdminController.getVerifications);
router.get('/verifications/:id', AdminController.getVerificationById);
router.patch('/verifications/:id/status', AdminController.updateVerificationStatus);

// Professionals Management
router.get('/professionals', AdminController.getProfessionals);
router.get('/professionals/:id', AdminController.getProfessionalById);
router.patch('/professionals/:id/status', AdminController.updateProfessionalStatus);
router.patch('/professionals/:id/verify', AdminController.updateProfessionalVerification);

// Service Requests Management & Reassignment
router.get('/services/requests', AdminController.getServiceRequests);
router.get('/services/requests/:id', AdminController.getServiceRequestById);
router.patch('/services/requests/:id/assignment', AdminController.reassignServiceRequest);

// Notifications & Broadcast Announcements
router.get('/notifications', AdminController.getNotifications);
router.post('/notifications/broadcast', AdminController.broadcastNotification);

// Audit Logging
router.get('/audit', AdminController.getAuditLogs);

export default router;
