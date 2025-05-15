import { Request, Response, NextFunction } from 'express';
import { findAuthorizedSystemByName, verifyApiKey } from '../../../core/services/authorizedSystem.service';
import logger from '../../../lib/logger';
import { UnauthorizedError, ForbiddenError } from '../../../errors/ApiError';

/**
 * Middleware para autenticar sistemas cliente mediante API Key
 */
export async function requireAuthorization(req: Request, res: Response, next: NextFunction) {
  try {
    // Extraer Client ID y API Key de las cabeceras
    const clientId = req.header('X-Client-ID');
    const apiKey = req.header('X-API-Key');

    // Verificar que ambas cabeceras estén presentes
    if (!clientId || !apiKey) {
      throw new UnauthorizedError('Missing authentication credentials');
    }

    // Buscar el sistema autorizado por nombre (Client ID)
    const system = await findAuthorizedSystemByName(clientId);

    // Verificar que el sistema existe y está activo
    if (!system || !system.isActive) {
      throw new UnauthorizedError('Invalid or inactive client');
    }

    // Verificar la API Key
    const isValidKey = await verifyApiKey(apiKey, system.apiKeyHash);
    if (!isValidKey) {
      throw new ForbiddenError('Invalid API key');
    }

    // Adjuntar información del sistema a la solicitud
    req.clientInfo = {
      id: system.id,
      name: system.name,
      permissions: system.permissions
    };

    // Continuar con el siguiente middleware o controlador
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return next(error);
    }
    
    logger.error('Authentication error', { error });
    return next(new UnauthorizedError('Authentication failed'));
  }
}

/**
 * Middleware para verificar permisos específicos
 */
export function checkPermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar que el cliente está autenticado
    if (!req.clientInfo) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Verificar que el cliente tiene el permiso requerido
    if (!req.clientInfo.permissions.includes(requiredPermission)) {
      return next(new ForbiddenError(`Missing required permission: ${requiredPermission}`));
    }

    // Continuar con el siguiente middleware o controlador
    next();
  };
}