import { Request, Response, NextFunction } from 'express';
import { getEmailLogs, getEmailLog, updateLogStatus } from '../../../../core/services/log.service';
import { ApiError } from '../../../../errors/ApiError';

export const getEmailLogsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getEmailLogs();
    res.json(logs);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};

export const getEmailLogCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await getEmailLog(id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.json(log);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};

export const updateEmailLogStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, error, metadata, sentAt, deliveredAt, openedAt, clickedAt } = req.body;
    const log = await updateLogStatus(id, status, { error, metadata, sentAt, deliveredAt, openedAt, clickedAt });
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.json(log);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};