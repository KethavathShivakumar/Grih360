import { Request, Response } from 'express';
import { GeographyService } from '../config/geography.config';

export class LocationController {
  /**
   * Get supported States
   */
  static async getStates(_req: Request, res: Response) {
    try {
      const states = GeographyService.getStates();
      return res.status(200).json({
        success: true,
        data: states,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch states',
      });
    }
  }

  /**
   * Get canonical Districts, optionally filtered by State
   */
  static async getDistricts(req: Request, res: Response) {
    try {
      const state = (req.query.state as string) || (req.query.stateCode as string);
      const districts = GeographyService.getDistrictsByState(state);
      return res.status(200).json({
        success: true,
        data: districts,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch districts',
      });
    }
  }

  /**
   * Get single District details by name/code
   */
  static async getDistrictByName(req: Request, res: Response) {
    try {
      const name = String(req.params.name || '');
      const district = GeographyService.findDistrict(name);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: `District '${name}' not found`,
        });
      }
      return res.status(200).json({
        success: true,
        data: district,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch district details',
      });
    }
  }
}
