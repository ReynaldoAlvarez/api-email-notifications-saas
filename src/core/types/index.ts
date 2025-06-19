import { Request } from 'express';

// Extender la interfaz Request para incluir información del cliente autenticado
declare global {
  namespace Express {
    interface Request {
      clientInfo?: {
        id: string;
        name: string;
        permissions: string[];
      };
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthorizedSystemInfo {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  apiKeyHash: string;
}
// NUEVO: Interface para usuarios autenticados
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isActive: boolean;
}