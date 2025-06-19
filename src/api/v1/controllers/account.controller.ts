import { Request, Response, NextFunction } from 'express';
import {
  updateProfileSchema,
  createOrganizationSchema,
  regenerateApiKeySchema,
} from '../validators/account.validators';
import * as userService from '../../../core/services/user.service';
import * as organizationService from '../../../core/services/organization.service';
import logger from '../../../lib/logger';
import { BadRequestError } from '../../../errors/ApiError';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }

    const user = await userService.findUserById(req.user.id);
    
    if (!user) {
      throw new BadRequestError('Usuario no encontrado');
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }

    const validationResult = updateProfileSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Datos inválidos: ${validationResult.error.message}`);
    }

    const updatedUser = await userService.updateUser(req.user.id, validationResult.data);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrganizations(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }

    const organizations = await organizationService.getUserOrganizations(req.user.id);

    res.json({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        website: org.website,
        industry: org.industry,
        role: org.role,
        createdAt: org.createdAt,
        subscription: org.subscription ? {
          plan: org.subscription.plan,
          status: org.subscription.status,
        } : null,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }

    const validationResult = createOrganizationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Datos inválidos: ${validationResult.error.message}`);
    }

    const { organization, authorizedSystem, apiKey } = await organizationService.createOrganization(
      req.user.id,
      validationResult.data
    );

    res.status(201).json({
      message: 'Organización creada exitosamente',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        website: organization.website,
        industry: organization.industry,
      },
      apiCredentials: {
        clientId: authorizedSystem.id,
        apiKey,
        systemName: authorizedSystem.name,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }

    const { organizationId } = req.params;
    
    if (!organizationId) {
      throw new BadRequestError('ID de organización requerido');
    }

    const apiKeys = await organizationService.getOrganizationApiKeys(req.user.id, organizationId);

    res.json({
      apiKeys,
    });
  } catch (error) {
    next(error);
  }
}

export async function regenerateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }

    const validationResult = regenerateApiKeySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Datos inválidos: ${validationResult.error.message}`);
    }

    const { systemId } = validationResult.data;
    const { apiKey } = await organizationService.regenerateApiKey(req.user.id, systemId);

    res.json({
      message: 'API Key regenerada exitosamente',
      apiKey,
    });
  } catch (error) {
    next(error);
  }
}