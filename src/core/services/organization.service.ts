import { Organization, UserOrganization, OrganizationRole, AuthorizedSystem } from '@prisma/client';
import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import { ConflictError, NotFoundError, ForbiddenError } from '../../errors/ApiError';
import { generateApiKey, hashApiKey } from './authorizedSystem.service';

export async function createOrganization(
  userId: string,
  data: {
    name: string;
    description?: string;
    website?: string;
    industry?: string;
  }
): Promise<{ organization: Organization; authorizedSystem: AuthorizedSystem; apiKey: string }> {
  try {
    // Generar slug único
    const baseSlug = data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Crear organización, relación usuario-organización y sistema autorizado
    const result = await prisma.$transaction(async (tx) => {
      // Crear organización
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          website: data.website,
          industry: data.industry,
        },
      });

      // Crear relación usuario-organización como OWNER
      await tx.userOrganization.create({
        data: {
          userId,
          organizationId: organization.id,
          role: OrganizationRole.OWNER,
        },
      });

      // Generar API Key para el sistema autorizado
      const apiKey = generateApiKey();
      const apiKeyHash = await hashApiKey(apiKey);

      // Crear sistema autorizado para la organización con plan Free por defecto
      const authorizedSystem = await tx.authorizedSystem.create({
        data: {
          name: `${organization.name} - API System`,
          apiKeyHash,
          description: `Sistema API para ${organization.name}`,
          organizationId: organization.id,
          allowedOrigins: [],
        },
      });

      // Crear suscripción al plan Free
      const freePlan = await tx.plan.findUnique({ where: { slug: 'free' } });
      if (freePlan) {
        await tx.subscription.create({
          data: {
            organizationId: organization.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            startDate: new Date(),
          },
        });
      }

      // Asignar permisos básicos al sistema
      const basicPermissions = await tx.permission.findMany({
        where: { planLevel: 'free' }
      });

      for (const permission of basicPermissions) {
        await tx.systemPermission.create({
          data: {
            systemId: authorizedSystem.id,
            permissionId: permission.id,
          },
        });
      }

      return { organization, authorizedSystem, apiKey };
    });

    logger.info(`Organization created: ${data.name} by user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Error creating organization', { error, userId, data });
    throw error;
  }
}

export async function getUserOrganizations(userId: string): Promise<Array<Organization & {
  role: OrganizationRole;
  subscription?: {
    plan: {
      name: string;
      slug: string;
      emailsPerMonth: number;
    };
    status: string;
  };
}>> {
  try {
    const userOrganizations = await prisma.userOrganization.findMany({
      where: { 
        userId,
        isActive: true,
      },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: {
                plan: {
                  select: {
                    name: true,
                    slug: true,
                    emailsPerMonth: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    return userOrganizations.map(uo => ({
      ...uo.organization,
      role: uo.role,
      subscription: uo.organization.subscriptions[0] || undefined,
    }));
  } catch (error) {
    logger.error('Error getting user organizations', { error, userId });
    throw error;
  }
}

export async function getOrganizationApiKeys(
  userId: string,
  organizationId: string
): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}>> {
  try {
    // Verificar que el usuario pertenece a la organización
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!userOrg || !userOrg.isActive) {
      throw new ForbiddenError('No tienes acceso a esta organización');
    }

    // Obtener sistemas autorizados de la organización
    const systems = await prisma.authorizedSystem.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        emailLogs: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return systems.map(system => ({
      id: system.id,
      name: system.name,
      description: system.description,
      isActive: system.isActive,
      createdAt: system.createdAt,
      lastUsed: system.emailLogs[0]?.createdAt,
    }));
  } catch (error) {
    logger.error('Error getting organization API keys', { error, userId, organizationId });
    throw error;
  }
}

export async function regenerateApiKey(
  userId: string,
  systemId: string
): Promise<{ apiKey: string }> {
  try {
    // Verificar que el sistema existe y el usuario tiene acceso
    const system = await prisma.authorizedSystem.findUnique({
      where: { id: systemId },
      include: {
        organization: {
          include: {
            users: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!system || !system.organization) {
      throw new NotFoundError('Sistema no encontrado');
    }

    if (system.organization.users.length === 0) {
      throw new ForbiddenError('No tienes acceso a este sistema');
    }

    // Verificar que el usuario tiene rol de OWNER o ADMIN
    const userRole = system.organization.users[0].role;
    if (userRole !== OrganizationRole.OWNER && userRole !== OrganizationRole.ADMIN) {
      throw new ForbiddenError('No tienes permisos para regenerar API keys');
    }

    // Generar nueva API Key
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // Actualizar el sistema
    await prisma.authorizedSystem.update({
      where: { id: systemId },
      data: { apiKeyHash },
    });

    logger.info(`API Key regenerated for system ${systemId} by user ${userId}`);
    return { apiKey };
  } catch (error) {
    logger.error('Error regenerating API key', { error, userId, systemId });
    throw error;
  }
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  try {
    return await prisma.organization.findUnique({
      where: { id }
    });
  } catch (error) {
    logger.error('Error finding organization by ID', { error, id });
    throw error;
  }
}

export async function checkUserOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole?: OrganizationRole
): Promise<UserOrganization> {
  try {
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!userOrg || !userOrg.isActive) {
      throw new ForbiddenError('No tienes acceso a esta organización');
    }

    if (requiredRole) {
      const roleHierarchy = {
        [OrganizationRole.MEMBER]: 1,
        [OrganizationRole.ADMIN]: 2,
        [OrganizationRole.OWNER]: 3,
      };

      if (roleHierarchy[userOrg.role] < roleHierarchy[requiredRole]) {
        throw new ForbiddenError('No tienes los permisos necesarios');
      }
    }

    return userOrg;
  } catch (error) {
    logger.error('Error checking user organization access', { error, userId, organizationId });
    throw error;
  }
}