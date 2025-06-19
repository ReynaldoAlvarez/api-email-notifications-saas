import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError } from '../errors/ApiError';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: '7d', // Token válido por 7 días
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.security.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError('Token inválido o expirado');
  }
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: '30d', // Refresh token válido por 30 días
  });
}