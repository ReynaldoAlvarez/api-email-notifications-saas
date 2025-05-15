// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import logger from '../lib/logger';
import config from '../config';

export function errorConverter(err: any, req: Request, res: Response, next: NextFunction) {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
}

export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction) {
  const { statusCode, message } = err;
  
  // Log error
  logger.error(err);
  
  const response = {
    code: statusCode,
    message,
    ...(config.isDev && { stack: err.stack }),
  };
  
  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
}