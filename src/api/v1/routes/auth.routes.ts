import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta de usuario. Se enviará un email de verificación.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$'
 *                 description: Nombre del usuario
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$'
 *                 description: Apellido del usuario
 *                 example: Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 description: Correo electrónico único
 *                 example: juan.perez@ejemplo.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)'
 *                 description: Contraseña (mín. 8 caracteres, debe incluir mayúscula, minúscula y número)
 *                 example: MiPassword123
 *           examples:
 *             usuario_ejemplo:
 *               summary: Usuario de ejemplo
 *               value:
 *                 firstName: Juan
 *                 lastName: Pérez
 *                 email: juan.perez@ejemplo.com
 *                 password: MiPassword123
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos de registro inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: El email ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: juan.perez@ejemplo.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: MiPassword123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Inicio de sesión exitoso
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Credenciales inválidas o cuenta no verificada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verificar correo electrónico
 *     description: Verifica el correo electrónico usando el token enviado por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de verificación recibido por email
 *                 example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Correo electrónico verificado exitosamente
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con enlace para restablecer la contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: juan.perez@ejemplo.com
 *     responses:
 *       200:
 *         description: Email de recuperación enviado (si el email existe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Si el correo existe, recibirás un enlace de recuperación
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Restablecer contraseña
 *     description: Restablece la contraseña usando el token de recuperación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de recuperación recibido por email
 *                 example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)'
 *                 description: Nueva contraseña
 *                 example: MiNuevaPassword123
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña actualizada exitosamente
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Token inválido, expirado o ya usado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', resetPassword);

export default router;