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