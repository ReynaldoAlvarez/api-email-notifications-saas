import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getOrganizations,
  createOrganization,
  getApiKeys,
  regenerateApiKey,
} from '../controllers/account.controller';
import { requireUserAuth } from '../middlewares/requireUserAuth';

const router = Router();

// Todas las rutas de cuenta requieren autenticación JWT
router.use(requireUserAuth);

/**
 * @swagger
 * /api/v1/account/profile:
 *   get:
 *     tags: [Account]
 *     summary: Obtener perfil del usuario
 *     description: Obtiene la información del perfil del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Fecha de creación de la cuenta
 *                         lastLoginAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Fecha del último inicio de sesión
 *             examples:
 *               perfil_usuario:
 *                 summary: Ejemplo de perfil de usuario
 *                 value:
 *                   user:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     firstName: "Juan"
 *                     lastName: "Pérez"
 *                     email: "juan.perez@ejemplo.com"
 *                     emailVerified: true
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     lastLoginAt: "2024-01-20T14:45:00Z"
 *       401:
 *         description: Token de autenticación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/account/profile:
 *   put:
 *     tags: [Account]
 *     summary: Actualizar perfil del usuario
 *     description: Actualiza la información del perfil del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$'
 *                 description: Nuevo nombre del usuario
 *                 example: Juan Carlos
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$'
 *                 description: Nuevo apellido del usuario
 *                 example: Pérez García
 *           examples:
 *             actualizar_nombre:
 *               summary: Actualizar solo el nombre
 *               value:
 *                 firstName: "Juan Carlos"
 *             actualizar_completo:
 *               summary: Actualizar nombre y apellido
 *               value:
 *                 firstName: "Juan Carlos"
 *                 lastName: "Pérez García"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perfil actualizado exitosamente
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos de actualización inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de autenticación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /api/v1/account/organizations:
 *   get:
 *     tags: [Account]
 *     summary: Obtener organizaciones del usuario
 *     description: Obtiene todas las organizaciones a las que pertenece el usuario autenticado
 *     security:
 *     - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de organizaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizations:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Organization'
 *                       - type: object
 *                         properties:
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Fecha de creación de la organización
 *                           subscription:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               plan:
 *                               type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     description: Nombre del plan
 *                                     example: Free
 *                                   slug:
 *                                     type: string
 *                                     description: Slug del plan
 *                                     example: free
 *                                   emailsPerMonth:
 *                                     type: integer
 *                                     description: Límite de correos por mes
 *                                     example: 100
 *                               status:
 *                                 type: string
 *                                 enum: [TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED]
 *                                 description : Estado de la suscripción
 *                                 example: ACTIVE
 *             examples:
 *               organizaciones_usuario:
 *                 summary: Ejemplo de organizaciones de usuario
 *                 value:
 *                   organizations:
 *                     - id: "org-123"
 *                       name: "Mi Empresa"
 *                       slug: "mi-empresa"
 *                       description: "Descripción de mi empresa"
 *                       website: "https://miempresa.com"
 *                       industry: "Tecnología"
 *                       role: "OWNER"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       subscription:
 *                         plan:
 *                           name: "Free"
 *                           slug: "free"
 *                           emailsPerMonth: 100
 *                         status: "ACTIVE"
 *       401:
 *         description: Token de autenticación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/organizations', getOrganizations);

/**
 * @swagger
 * /api/v1/account/organizations:
 *   post:
 *     tags: [Account]
 *     summary: Crear nueva organización
 *     description: Crea una nueva organización y genera automáticamente las credenciales API
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre de la organización
 *                 example: Mi Nueva Empresa
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción de la organización
 *                 example: Una empresa dedicada al desarrollo de software
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Sitio web de la organización
 *                 example: https://minuevaempresa.com
 *               industry:
 *                 type: string
 *                 maxLength: 50
 *                 description: Industria de la organización
 *                 example: Tecnología
 *           examples:
 *             organizacion_basica:
 *               summary: Organización básica
 *               value:
 *                 name: "Mi Nueva Empresa"
 *             organizacion_completa:
 *               summary: Organización con todos los datos
 *               value:
 *                 name: "Mi Nueva Empresa"
 *                 description: "Una empresa dedicada al desarrollo de software"
 *                 website: "https://minuevaempresa.com"
 *                 industry: "Tecnología"
 *     responses:
 *       201:
 *         description: Organización creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organización creada exitosamente
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *                 apiCredentials:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                       format: uuid
 *                       description: Client ID para usar en X-Client-ID
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     apiKey:
 *                       type: string
 *                       description: API Key para usar en X-API-Key
 *                       example: "sk_1234567890abcdef1234567890abcdef"
 *                     systemName:
 *                       type: string
 *                       description: Nombre del sistema autorizado
 *                       example: "Mi Nueva Empresa - API System"
 *             examples:
 *               organizacion_creada:
 *                 summary: Respuesta de organización creada
 *                 value:
 *                   message: "Organización creada exitosamente"
 *                   organization:
 *                     id: "org-123"
 *                     name: "Mi Nueva Empresa"
 *                     slug: "mi-nueva-empresa"
 *                     description: "Una empresa dedicada al desarrollo de software"
 *                     website: "https://minuevaempresa.com"
 *                     industry: "Tecnología"
 *                   apiCredentials:
 *                     clientId: "123e4567-e89b-12d3-a456-426614174000"
 *                     apiKey: "sk_1234567890abcdef1234567890abcdef"
 *                     systemName: "Mi Nueva Empresa - API System"
 *       400:
 *         description: Datos de organización inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de autenticación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/organizations', createOrganization);

/**
 * @swagger
 * /api/v1/account/organizations/{organizationId}/api-keys:
 *   get:
 *     tags: [Account]
 *     summary: Obtener API keys de una organización
 *     description: Obtiene todas las API keys (sistemas autorizados) de una organización específica
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la organización
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Lista de API keys obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del sistema autorizado
 *                       name:
 *                         type: string
 *                         description: Nombre del sistema
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         description: Descripción del sistema
 *                       isActive:
 *                         type: boolean
 *                         description:Si el sistema está activo
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha de creación
 *                       lastUsed:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Fecha del último uso
 *             examples:
 *               api_keys_ejemplo:
 *                 summary: Ejemplo de API keys
 *                 value:
 *                   apiKeys:
 *                     - id: "sys-123"
 *                       name: "Mi Empresa - API System"
 *                       description: "Sistema API para Mi Empresa"
 *                       isActive: true
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       lastUsed: "2024-01-20T14:45:00Z"
 *       400:
 *         description: ID de organización requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de autenticación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No tienes acceso a esta organización
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/organizations/:organizationId/api-keys', getApiKeys);

/**
 * @swagger
 * /api/v1/account/api-keys/regenerate:
 *   post:
 *     tags: [Account]
 *     summary: Regenerar API key
 *     description: Regenera la API key de un sistema autorizado. Requiere permisos de OWNER o ADMIN.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemId
 *             properties:
 *               systemId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del sistema autorizado
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *           examples:
 *             regenerar_api_key:
 *               summary: Regenerar API key
 *               value:
 *                 systemId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: API key regenerada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API Key regenerada exitosamente
 *                 apiKey:
 *                   type: string
 *                   description: Nueva API key
 *                   example: "sk_9876543210fedcba9876543210fedcba"
 *             examples:
 *               api_key_regenerada:
 *                 summary: API key regenerada
 *                 value:
 *                   message: "API Key regenerada exitosamente"
 *                   apiKey: "sk_9876543210fedcba9876543210fedcba"
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de autenticación inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No tienes permisos para regenerar API keys
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sistema no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/api-keys/regenerate', regenerateApiKey);

export default router;