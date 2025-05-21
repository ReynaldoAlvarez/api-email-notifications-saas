import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import { AuthorizedSystemInfo } from '../types';
import { ApiError, NotFoundError, ConflictError } from '../../errors/ApiError';

/**
 * Genera una API Key segura
 */
export function generateApiKey(prefix = 'sk'): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

/**
 * Hashea una API Key para almacenarla de forma segura
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(apiKey, saltRounds);
}

/**
 * Verifica si una API Key coincide con su hash almacenado
 */
export async function verifyApiKey(apiKey: string, apiKeyHash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, apiKeyHash);
}

/**
 * Busca un sistema autorizado por su nombre (Client ID)
 */
export async function findAuthorizedSystemByName(name: string): Promise<AuthorizedSystemInfo | null> {
  try {
    const system = await prisma.authorizedSystem.findUnique({
      where: { name },
      include: {
        systemPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!system) {
      return null;
    }

    // Transformar los permisos del formato de relación al formato de array de códigos
    const permissions = system.systemPermissions.map(sp => sp.permission.code);

    return {
      id: system.id,
      name: system.name,
      permissions,
      isActive: system.isActive,
      apiKeyHash: system.apiKeyHash
    };
  } catch (error) {
    logger.error('Error finding authorized system', { error, name });
    throw new ApiError(500, 'Error finding authorized system');
  }
}

/**
 * Busca un sistema autorizado por su id
 */
export async function findAuthorizedSystemById(id: string): Promise<AuthorizedSystemInfo | null> {
  try {
    const system = await prisma.authorizedSystem.findUnique({
      where: { id },
      include: { systemPermissions: { include: { permission: true } } },
    });

    if (!system) {
      throw new NotFoundError('Authorized system not found');
    }

    // Transformar los permisos del formato de relación al formato de array de códigos
    const permissions = system.systemPermissions.map(sp => sp.permission.code);

    return {
      id: system.id,
      name: system.name,
      permissions,
      isActive: system.isActive,
      apiKeyHash: system.apiKeyHash
    };

  } catch (error) {
    logger.error('Error finding authorized system', { error, id }); 
    throw new ApiError(500, 'Error finding authorized system');
  }}

/**
 * Crea un nuevo sistema autorizado
 */
export async function createAuthorizedSystem(
  name: string,
  description: string | null,
  permissionCodes: string[],
  allowedOrigins: string[] = []
): Promise<{ system: AuthorizedSystemInfo; apiKey: string }> {
  try {
    // Verificar si ya existe un sistema con ese nombre
    const existingSystem = await prisma.authorizedSystem.findUnique({
      where: { name }
    });

    if (existingSystem) {
      throw new ConflictError(`A system with the name "${name}" already exists`);
    }

    // Verificar que todos los códigos de permisos existen
    const permissions = await prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes
        }
      }
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
      throw new NotFoundError(`Some permission codes do not exist: ${missingCodes.join(', ')}`);
    }

    // Generar API Key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // Crear el sistema autorizado en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el sistema
      const system = await tx.authorizedSystem.create({
        data: {
          name,
          description,
          apiKeyHash,
          allowedOrigins,
          isActive: true
        }
      });

      // Crear las relaciones con los permisos
      for (const permission of permissions) {
        await tx.systemPermission.create({
          data: {
            systemId: system.id,
            permissionId: permission.id
          }
        });
      }

      return {
        system: {
          id: system.id,
          name: system.name,
          permissions: permissionCodes,
          isActive: system.isActive,
          apiKeyHash: system.apiKeyHash
        },
        apiKey
      };
    });

    logger.info(`Created new authorized system: ${name}`);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Error creating authorized system', { error, name });
    throw new ApiError(500, 'Error creating authorized system');
  }
}

export async function updateAuthorizedSystem(
  id: string,
  name?: string,
  description?: string,
  permissionCodes?: string[],
  allowedOrigins?: string[],
  isActive?: boolean
): Promise<AuthorizedSystemInfo | null> {
  try {
    const system = await prisma.authorizedSystem.findUnique({
      where: { id }
    });

    if (!system) {
      return null;
    }

    const data: any = {};

    if (name) data.name = name;
    if (description) data.description = description;
    if (allowedOrigins) data.allowedOrigins = allowedOrigins;
    if (isActive !== undefined) data.isActive = isActive;

    if (permissionCodes) {
      const permissions = await prisma.permission.findMany({
        where: {
          code: {
            in: permissionCodes
          }
        }
      });

      if (permissions.length !== permissionCodes.length) {
        const foundCodes = permissions.map(p => p.code);
        const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
        throw new NotFoundError(`Some permission codes do not exist: ${missingCodes.join(', ')}`);
      }

      data.systemPermissions = {
        deleteMany: {},
        createMany: {
          data: permissions.map(permission => ({
            permissionId: permission.id
          }))
        }
      };
    }
    console.log("data:",data)


    const updatedSystem = await prisma.authorizedSystem.update({
      where: { id },
      data,
      include: { systemPermissions: { include: { permission: true } } }
    });


    const permissions = updatedSystem.systemPermissions.map(sp => sp.permission.code);

    return {
      id: updatedSystem.id,
      name: updatedSystem.name,
      permissions,
      isActive: updatedSystem.isActive,
      apiKeyHash: updatedSystem.apiKeyHash
    };
  } catch (error) {
    logger.error('Error updating authorized system', { error, id });
    throw new ApiError(500, 'Error updating authorized system');
  }
}

export async function deleteAuthorizedSystem(id: string): Promise<AuthorizedSystemInfo | null> {
  try {
    const system = await prisma.authorizedSystem.findUnique({
      where: { id }
    });

    if (!system) {
      return null;
    }

    const deletedSystem = await prisma.authorizedSystem.delete({
      where: { id },
      include: { systemPermissions: { include: { permission: true } } }
    });

    const permissions = deletedSystem.systemPermissions.map(sp => sp.permission.code);

    return {
      id: deletedSystem.id,
      name: deletedSystem.name,
      permissions,
      isActive: deletedSystem.isActive,
      apiKeyHash: deletedSystem.apiKeyHash
    };
  } catch (error) {
    logger.error('Error deleting authorized system', { error, id });
    throw new ApiError(500, 'Error deleting authorized system');
  }
}