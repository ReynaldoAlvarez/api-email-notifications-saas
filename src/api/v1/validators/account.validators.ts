import { z } from 'zod';

// Esquema para actualizar perfil
export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras')
    .optional(),
  
  lastName: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras')
    .optional(),
});

// Esquema para crear organización
export const createOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'El nombre de la organización debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  
  website: z.string()
    .url('URL del sitio web inválida')
    .optional(),
  
  industry: z.string()
    .max(50, 'La industria no puede exceder 50 caracteres')
    .optional(),
});

// Esquema para regenerar API key
export const regenerateApiKeySchema = z.object({
  systemId: z.string().uuid('ID de sistema inválido'),
});