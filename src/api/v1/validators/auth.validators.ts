import { z } from 'zod';

// Esquema para registro de usuario
export const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  
  lastName: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
  
  email: z.string()
    .email('Dirección de correo inválida')
    .max(255, 'El correo no puede exceder 255 caracteres'),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
});

// Esquema para login
export const loginSchema = z.object({
  email: z.string().email('Dirección de correo inválida'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Esquema para verificación de email
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
});

// Esquema para solicitud de reset de contraseña
export const forgotPasswordSchema = z.object({
  email: z.string().email('Dirección de correo inválida'),
});

// Esquema para reset de contraseña
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
});