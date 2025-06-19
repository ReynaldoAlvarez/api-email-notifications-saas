import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, EmailVerification, PasswordReset } from '@prisma/client';
import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import { ConflictError, NotFoundError, BadRequestError } from '../../errors/ApiError';
import { generateToken } from '../../lib/jwt';

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ user: User; verificationToken: string }> {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictError('Ya existe un usuario con este correo electrónico');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Crear usuario y token de verificación en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          passwordHash,
          emailVerified: false,
          isActive: true,
        },
      });

      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      await tx.emailVerification.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt,
        },
      });

      return { user, verificationToken };
    });

    logger.info(`User created: ${data.email}`);
    return result;
  } catch (error) {
    logger.error('Error creating user', { error, email: data.email });
    throw error;
  }
}

export async function verifyEmail(token: string): Promise<User> {
  try {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestError('Token de verificación inválido');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestError('Token de verificación expirado');
    }

    if (verification.user.emailVerified) {
      throw new BadRequestError('El correo electrónico ya ha sido verificado');
    }

    // Verificar email y eliminar token
    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      });

      await tx.emailVerification.delete({
        where: { id: verification.id },
      });

      return updatedUser;
    });

    logger.info(`Email verified: ${user.email}`);
    return user;
  } catch (error) {
    logger.error('Error verifying email', { error, token });
    throw error;
  }
}

export async function authenticateUser(email: string, password: string): Promise<{ user: User; token: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new BadRequestError('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new BadRequestError('Cuenta desactivada');
    }

    if (!user.emailVerified) {
      throw new BadRequestError('Debe verificar su correo electrónico antes de iniciar sesión');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestError('Credenciales inválidas');
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.info(`User authenticated: ${user.email}`);
    return { user, token };
  } catch (error) {
    logger.error('Error authenticating user', { error, email });
    throw error;
  }
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { id }
    });
  } catch (error) {
    logger.error('Error finding user by ID', { error, id });
    throw error;
  }
}

export async function updateUser(id: string, data: {
  firstName?: string;
  lastName?: string;
}): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    logger.info(`User updated: ${user.email}`);
    return user;
  } catch (error) {
    logger.error('Error updating user', { error, id });
    throw error;
  }
}

export async function createPasswordReset(email: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      throw new BadRequestError('Si el correo existe, recibirá un enlace de recuperación');
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    logger.info(`Password reset requested: ${email}`);
    return resetToken;
  } catch (error) {
    logger.error('Error creating password reset', { error, email });
    throw error;
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<User> {
  try {
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      throw new BadRequestError('Token de recuperación inválido');
    }

    if (reset.expiresAt < new Date()) {
      throw new BadRequestError('Token de recuperación expirado');
    }

    if (reset.usedAt) {
      throw new BadRequestError('Token de recuperación ya utilizado');
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña y marcar token como usado
    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      });

      await tx.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      });

      return updatedUser;
    });

    logger.info(`Password reset completed: ${user.email}`);
    return user;
  } catch (error) {
    logger.error('Error resetting password', { error, token });
    throw error;
  }
}