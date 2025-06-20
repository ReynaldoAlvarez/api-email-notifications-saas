import { NextFunction, Router, Request,Response } from 'express';
import { sendEmailHandler } from '../controllers/email.controller';
import { requireAuthorization, checkPermission } from '../middlewares/requireAuthorization';

const router = Router();

// Ruta para enviar correo (verifica permisos según el tipo de envío)
/**
 * @swagger
 * /api/v1/email/send:
 *   post:
 *     tags: [Email]
 *     summary: Enviar correo electrónico
 *     description: |
 *       Envía un correo electrónico usando dos métodos:
 *       
 *       **Envío Directo**: Especifica directamente el contenido del correo (requiere permiso `send_direct`)
 *       **Envío con Plantilla**: Usa una plantilla predefinida con variables dinámicas (requiere permiso `send_template`)
 *       
 *       ### Límites por Plan:
 *       - **Free**: 100 correos/mes, 10 requests/min
 *       - **Basic**: 1,000 correos/mes, 60 requests/min  
 *       - **Pro**: 10,000 correos/mes, 120 requests/min
 *       - **Enterprise**: 100,000 correos/mes, 300 requests/min
 *       
 *       ### Archivos Adjuntos:
 *       - Máximo 10MB por archivo
 *       - Formatos permitidos: PDF, DOCX, PNG, JPEG, JPG
 *       - Contenido en Base64
 *       
 *       ### Sistema de Colas:
 *       Los correos se procesan de forma asíncrona usando BullMQ con Redis.
 *       El endpoint devuelve un `jobId` para tracking del trabajo en la cola.
 *     security:
 *       - ApiKeyAuth: []
 *       - ClientIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *           examples:
 *             envio_directo_basico:
 *               summary: Envío directo básico
 *               description: Envío simple con contenido HTML (requiere permiso send_direct)
 *               value:
 *                 type: "direct"
 *                 to: "usuario@ejemplo.com"
 *                 subject: "Bienvenido a nuestro servicio"
 *                 html: "<h1>¡Hola!</h1><p>Gracias por registrarte en nuestro servicio.</p>"
 *             envio_directo_completo:
 *               summary: Envío directo completo
 *               description: Envío con múltiples destinatarios, CC, BCC y adjuntos
 *               value:
 *                 type: "direct"
 *                 to: ["usuario1@ejemplo.com", "usuario2@ejemplo.com"]
 *                 cc: "supervisor@ejemplo.com"
 *                 bcc: "admin@ejemplo.com"
 *                 subject: "Reporte mensual"
 *                 html: "<h1>Reporte Mensual</h1><p>Adjunto encontrarás el reporte del mes.</p>"
 *                 text: "Reporte Mensual\n\nAdjunto encontrarás el reporte del mes."
 *                 attachments:
 *                   - filename: "reporte.pdf"
 *                     content: "JVBERi0xLjQKJcOkw7zDtsO..."
 *                     contentType: "application/pdf"
 *                     size: 1024000
 *                     format: "pdf"
 *                 metadata:
 *                   campaign: "monthly-report"
 *                   userId: "12345"
 *             envio_con_plantilla:
 *               summary: Envío con plantilla
 *               description: Envío usando una plantilla predefinida (requiere permiso send_template)
 *               value:
 *                 type: "template"
 *                 to: "usuario@ejemplo.com"
 *                 templateId: "123e4567-e89b-12d3-a456-426614174000"
 *                 variables:
 *                   nombre: "Juan Pérez"
 *                   empresa: "Mi Empresa"
 *                   enlace_activacion: "https://miapp.com/activate/abc123"
 *                   fecha_expiracion: "2024-02-15"
 *                 metadata:
 *                   campaign: "user-activation"
 *             envio_transaccional:
 *               summary: Correo transaccional
 *               description: Ejemplo de correo de confirmación de compra
 *               value:
 *                 type: "direct"
 *                 to: "cliente@ejemplo.com"
 *                 subject: "Confirmación de compra #12345"
 *                 html: |
 *                   <div style="font-family: Arial, sans-serif;">
 *                     <h2>¡Gracias por tu compra!</h2>
 *                     <p>Tu pedido #12345 ha sido confirmado.</p>
 *                     <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
 *                       <h3>Detalles del pedido:</h3>
 *                       <p><strong>Total:</strong> $99.99</p>
 *                       <p><strong>Fecha de entrega estimada:</strong> 3-5 días hábiles</p>
 *                     </div>
 *                   </div>
 *                 metadata:
 *                   order_id: "12345"
 *                   customer_id: "67890"
 *                   amount: 99.99
 *             ejemplo_postman_real:
 *               summary: Ejemplo real de Postman (funcional)
 *               description: Basado en las pruebas reales que realizaste
 *               value:
 *                 type: "direct"
 *                 to: "iadevs7@gmail.com"
 *                 subject: "Prueba saas by system id authorized"
 *                 html: "<h1>Hola</h1><p>Este es un correo de prueba enviado directamente.</p>"
 *                 text: "Hola. Este es un correo de prueba enviado directamente."
 *     responses:
 *       202:
 *         description: Correo encolado para envío exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email queued for delivery"
 *                 jobId:
 *                   type: string
 *                   description: ID del trabajo en la cola BullMQ
 *                   example: "job_123e4567-e89b-12d3-a456-426614174000"
 *             examples:
 *               correo_encolado:
 *                 summary: Correo encolado exitosamente
 *                 value:
 *                   message: "Email queued for delivery"
 *                   jobId: "job_123e4567-e89b-12d3-a456-426614174000"
 *       400:
 *         description: Datos de correo inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               datos_invalidos:
 *                 summary: Datos inválidos
 *                 value:
 *                   error: "Invalid request data"
 *                   message: "El asunto es requerido"
 *                   statusCode: 400
 *               contenido_requerido:
 *                 summary: Contenido HTML o texto requerido
 *                 value:
 *                   error: "Invalid request data"
 *                   message: "Debe proporcionar contenido HTML o texto plano"
 *                   statusCode: 400
 *               email_invalido:
 *                 summary: Dirección de correo inválida
 *                 value:
 *                   error: "Invalid request data"
 *                   message: "Dirección de correo inválida"
 *                   statusCode: 400
 *               archivo_muy_grande:
 *                 summary: Archivo adjunto muy grande
 *                 value:
 *                   error: "File too large"
 *                   message: "El tamaño del archivo no puede exceder 10 MB"
 *                   statusCode: 400
 *               formato_no_permitido:
 *                 summary: Formato de archivo no permitido
 *                 value:
 *                   error: "Invalid file format"
 *                   message: "Formato de archivo no permitido"
 *                   statusCode: 400
 *               system_id_faltante:
 *                 summary: System ID no encontrado
 *                 value:
 *                   error: "Bad Request"
 *                   message: "System ID not found in request"
 *                   statusCode: 400
 *       401:
 *         description: Credenciales de API inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               credenciales_invalidas:
 *                 summary: API Key inválida
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "API Key inválida"
 *                   statusCode: 401
 *               client_id_faltante:
 *                 summary: Client ID faltante
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "X-Client-ID header requerido"
 *                   statusCode: 401
 *               api_key_faltante:
 *                 summary: API Key faltante
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "X-API-Key header requerido"
 *                   statusCode: 401
 *       403:
 *         description: Sin permisos o límite excedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               permiso_send_direct:
 *                 summary: Sin permiso para envío directo
 *                 value:
 *                   error: "Forbidden"
 *                   message: "Missing required permission: send_direct"
 *                   statusCode: 403
 *               permiso_send_template:
 *                 summary: Sin permiso para envío con plantilla
 *                 value:
 *                   error: "Forbidden"
 *                   message: "Missing required permission: send_template"
 *                   statusCode: 403
 *               limite_excedido:
 *                 summary: Límite de correos excedido
 *                 value:
 *                   error: "Limit exceeded"
 *                   message: "Has excedido el límite de correos para tu plan"
 *                   statusCode: 403
 *               sistema_inactivo:
 *                 summary: Sistema autorizado inactivo
 *                 value:
 *                   error: "Forbidden"
 *                   message: "Sistema autorizado inactivo"
 *                   statusCode: 403
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               plantilla_no_encontrada:
 *                 summary: Plantilla no encontrada
 *                 value:
 *                   error: "Template not found"
 *                   message: "Template not found or inactive:123e4567-e89b-12d3-a456-426614174000"
 *                   statusCode: 404
 *               sistema_no_encontrado:
 *                 summary: Sistema autorizado no encontrado
 *                 value:
 *                   error: "Not Found"
 *                   message: "Sistema autorizado no encontrado"
 *                   statusCode: 404
 *       429:
 *         description: Demasiadas solicitudes (rate limit excedido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               rate_limit:
 *                 summary: Rate limit excedido
 *                 value:
 *                   error: "Too Many Requests"
 *                   message: "Demasiadas solicitudes. Límite: 60 requests/min"
 *                   statusCode: 429
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               error_interno:
 *                 summary: Error interno del servidor
 *                 value:
 *                   error: "Internal Server Error"
 *                   message: "Error interno del servidor"
 *                   statusCode: 500
 *               error_cola:
 *                 summary: Error en la cola de trabajos
 *                 value:
 *                   error: "Queue Error"
 *                   message: "Error al encolar el trabajo de envío"
 *                   statusCode: 500
 *               error_ses:
 *                 summary: Error de AWS SES
 *                 value:
 *                   error: "SES Error"
 *                   message: "Error al enviar correo a través de AWS SES"
 *                   statusCode: 500
 */
router.post('/send', requireAuthorization, (req: Request, res: Response, next: NextFunction): void => {
  // Determinar el tipo de envío y verificar el permiso correspondiente
  const isTemplateEmail = req.body.type === 'template';
  const requiredPermission = isTemplateEmail ? 'send_template' : 'send_direct';
  
  // Verificar que el cliente tiene el permiso requerido
  if (!req.clientInfo?.permissions.includes(requiredPermission)) {
     res.status(403).json({
      error: `Missing required permission: ${requiredPermission}`
    });
  }
  
  next();
}, sendEmailHandler as any);

export default router;