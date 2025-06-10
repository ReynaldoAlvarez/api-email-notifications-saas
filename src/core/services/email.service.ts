import { EmailStatus } from '@prisma/client';
import { sendEmail } from '../../lib/sesClient';
import * as logService from './log.service';
import * as templateService from './template.service';
import logger from '../../lib/logger';

/**
 * Procesa y envía un correo electrónico directo
 */
export async function sendDirectEmail(
  data: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType?: string;
      size?: number;
      format?: string;
    }>;
    metadata?: Record<string, any>;
  },
  systemId: string
) {
  try {
    // Validar tamaños y formatos de archivos adjuntos
    if (data.attachments) {
      for (const attachment of data.attachments) {
        if (attachment.size && attachment.size > 10 * 1024 * 1024) {
          throw new Error('El tamaño del archivo no puede exceder 10 MB');
        }
        if (attachment.format && !['pdf', 'docx', 'png', 'jpeg', 'jpg'].includes(attachment.format.toLowerCase())) {
          throw new Error('Formato de archivo no permitido');
        }
      }
    }
    // Convertir destinatarios a formato de cadena para el log
    const toStr = Array.isArray(data.to) ? data.to.join(',') : data.to;
    
    // Crear registro inicial en la base de datos
    const emailLog = await logService.createInitialLog({
      to: toStr,
      subject: data.subject,
      body: data.html || data.text,
      systemId,
      attachments: data.attachments,
      metadata: data.metadata,
    });

    // Preparar adjuntos si existen
    const attachments = data.attachments?.map(attachment => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
      contentType: attachment.contentType,
    }));

    // Enviar correo a través de AWS SES
    try {
      const { messageId } = await sendEmail({
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        html: data.html,
        text: data.text,
        attachments,
        tags: {
          emailLogId: emailLog.id,
          systemId,
        },
      });

      // Actualizar registro con estado QUEUED y el ID del mensaje de SES
      await logService.updateLogStatus(emailLog.id, EmailStatus.QUEUED, {
        sentAt: new Date(),
        metadata: {
          sesMessageId: messageId,
        },
      });

      return {
        success: true,
        emailId: emailLog.id,
        messageId,
      };
    } catch (error) {
      // Si falla el envío, actualizar el registro con estado FAILED
      await logService.updateLogError(emailLog.id, error as any);
      
      logger.error('Failed to send email', { error, emailId: emailLog.id });
      
      return {
        success: false,
        emailId: emailLog.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    logger.error('Error in sendDirectEmail', { error, data });
    throw error;
  }
}

/**
 * Procesa y envía un correo electrónico usando una plantilla
 */
export async function sendTemplateEmail(
  data: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    templateId: string;
    variables?: Record<string, any>;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType?: string;
      size?: number;
      format?: string;
    }>;
    metadata?: Record<string, any>;
  },
  systemId: string
) {
  try {
    // Validar tamaños y formatos de archivos adjuntos
    if (data.attachments) {
      for (const attachment of data.attachments) {
        if (attachment.size && attachment.size > 10 * 1024 * 1024) {
          throw new Error('El tamaño del archivo no puede exceder 10 MB');
        }
        if (attachment.format && !['pdf', 'docx', 'png', 'jpeg', 'jpg'].includes(attachment.format.toLowerCase())) {
          throw new Error('Formato de archivo no permitido');
        }
      }
    }

    // Obtener y renderizar la plantilla
    const renderedTemplate = await templateService.renderTemplate(
      data.templateId,
      data.variables || {}
    );

    if (!renderedTemplate) {
      throw new Error(`Template not found or inactive: ${data.templateId}`);
    }

    // Convertir destinatarios a formato de cadena para el log
    const toStr = Array.isArray(data.to) ? data.to.join(',') : data.to;
    
    // Crear registro inicial en la base de datos
    const emailLog = await logService.createInitialLog({
      to: toStr,
      subject: renderedTemplate.subject,
      body: renderedTemplate.html || renderedTemplate.text,
      systemId,
      templateId: data.templateId,
      attachments: data.attachments,
      metadata: {
        ...data.metadata,
        variables: data.variables || {},
      },
    });

    // Preparar adjuntos si existen
    const attachments = data.attachments?.map(attachment => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content, 'base64'),
      contentType: attachment.contentType,
    }));

    // Enviar correo a través de AWS SES
    try {
      const { messageId } = await sendEmail({
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: renderedTemplate.subject,
        html: renderedTemplate.html,
        text: renderedTemplate.text,
        attachments,
        tags: {
          emailLogId: emailLog.id,
          systemId,
          templateId: data.templateId,
        },
      });

      // Actualizar registro con estado QUEUED y el ID del mensaje de SES
      await logService.updateLogStatus(emailLog.id, EmailStatus.QUEUED, {
        sentAt: new Date(),
        metadata: {
          sesMessageId: messageId,
        },
      });

      return {
        success: true,
        emailId: emailLog.id,
        messageId,
      };
    } catch (error) {
      // Si falla el envío, actualizar el registro con estado FAILED
      await logService.updateLogError(emailLog.id, error as any);
      
      logger.error('Failed to send template email', { error, emailId: emailLog.id });
      
      return {
        success: false,
        emailId: emailLog.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    logger.error('Error in sendTemplateEmail', { error, data });
    throw error;
  }
}