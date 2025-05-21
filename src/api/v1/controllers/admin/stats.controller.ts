import { Request, Response, NextFunction } from 'express';
import { getSystemStats, getEmailStats } from '../../../../core/services/stats.service';
import { ApiError } from '../../../../errors/ApiError';

export const getSystemStatsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};

export const getEmailStatsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getEmailStats();
    res.json(stats);
  } catch (error: any) {
    next(new ApiError(500, error.message));
  }
};