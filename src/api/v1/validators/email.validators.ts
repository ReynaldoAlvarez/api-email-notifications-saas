import { z } from 'zod';

// Esquema para validar archivos adjuntos
const attachmentSchema = z.object({
  filename: z.string().min(1, 'El nombre del archivo es requerido'),
  content: z.string().min(1, 'El contenido del archivo es requerido'), // Base64
  contentType: z.string().optional(),
});

// Esquema para envío directo de correo
const directEmailBaseSchema = z.object({
  to: z.union([
    z.string().email('Dirección de correo inválida'),
    z.array(z.string().email('Dirección de correo inválida')),
  ]),
  cc: z.union([
    z.string().email('Dirección de correo CC inválida'),
    z.array(z.string().email('Dirección de correo CC inválida')),
  ]).optional(),
  bcc: z.union([
    z.string().email('Dirección de correo BCC inválida'),
    z.array(z.string().email('Dirección de correo BCC inválida')),
  ]).optional(),
  subject: z.string().min(1, 'El asunto es requerido').max(255, 'El asunto no puede exceder 255 caracteres'),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Esquema completo con refinamiento
export const sendDirectEmailSchema = directEmailBaseSchema.refine(data => data.html || data.text, {
  message: 'Debe proporcionar contenido HTML o texto plano',
  path: ['content'],
});
// Esquema para envío de correo con plantilla
export const sendTemplateEmailSchema = z.object({
  to: z.union([
    z.string().email('Dirección de correo inválida'),
    z.array(z.string().email('Dirección de correo inválida')),
  ]),
  cc: z.union([
    z.string().email('Dirección de correo CC inválida'),
    z.array(z.string().email('Dirección de correo CC inválida')),
  ]).optional(),
  bcc: z.union([
    z.string().email('Dirección de correo BCC inválida'),
    z.array(z.string().email('Dirección de correo BCC inválida')),
  ]).optional(),
  templateId: z.string().uuid('ID de plantilla inválido'),
  variables: z.record(z.string(), z.any()),
  attachments: z.array(attachmentSchema).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Esquema unificado que acepta cualquiera de los dos formatos
export const sendEmailSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('direct'), ...directEmailBaseSchema.shape }),
  z.object({ type: z.literal('template'), ...sendTemplateEmailSchema.shape }),
]);

