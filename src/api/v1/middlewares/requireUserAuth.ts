import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../../lib/jwt';
import { UnauthorizedError } from '../../../errors/ApiError';
import * as userService from '../../../core/services/user.service';

export async function requireUserAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de autorización requerido');
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    const payload = verifyToken(token);

    // Verificar que el usuario existe y está activo
    const user = await userService.findUserById(payload.userId);
    if (!user || !user.isActive || !user.emailVerified) {
      throw new UnauthorizedError('Usuario no válido o inactivo');
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    next(error);
  }
}