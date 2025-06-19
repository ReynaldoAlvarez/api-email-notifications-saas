import { Request, Response, NextFunction } from 'express';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';
import * as userService from '../../../core/services/user.service';
import * as emailService from '../../../core/services/email.service';
import logger from '../../../lib/logger';
import { BadRequestError } from '../../../errors/ApiError';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Datos de registro inválidos: ${validationResult.error.message}`);
    }

    const { firstName, lastName, email, password } = validationResult.data;

    const { user, verificationToken } = await userService.createUser({
      firstName,
      lastName,
      email,
      password,
    });

    // TODO: Enviar email de verificación
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = verifyEmailSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Token inválido: ${validationResult.error.message}`);
    }

    const { token } = validationResult.data;
    const user = await userService.verifyEmail(token);

    res.json({
      message: 'Correo electrónico verificado exitosamente',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Credenciales inválidas: ${validationResult.error.message}`);
    }

    const { email, password } = validationResult.data;
    const { user, token } = await userService.authenticateUser(email, password);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Email inválido: ${validationResult.error.message}`);
    }

    const { email } = validationResult.data;
    const resetToken = await userService.createPasswordReset(email);

    // TODO: Enviar email de recuperación
    // await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'Si el correo existe, recibirás un enlace de recuperación',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Datos inválidos: ${validationResult.error.message}`);
    }

    const { token, password } = validationResult.data;
    const user = await userService.resetPassword(token, password);

    res.json({
      message: 'Contraseña actualizada exitosamente',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}