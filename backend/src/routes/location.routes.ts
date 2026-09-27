import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();

router.get('/states', LocationController.getStates);
router.get('/districts', LocationController.getDistricts);
router.get('/districts/:name', LocationController.getDistrictByName);

export default router;
