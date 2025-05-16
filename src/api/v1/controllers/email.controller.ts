import { Request, Response, NextFunction } from 'express';
import { sendEmailSchema } from '../validators/email.validators';
import * as emailService from '../../../core/services/email.service';
import logger from '../../../lib/logger';
import { BadRequestError } from '../../../errors/ApiError';

/**
 * Controlador para enviar correos electrónicos
 */
export async function sendEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Validar el cuerpo de la solicitud
    const validationResult = sendEmailSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new BadRequestError(`Invalid request data: ${validationResult.error.message}`);
    }
    
    const data = validationResult.data;
    const systemId = req.clientInfo?.id;
    
    if (!systemId) {
      throw new BadRequestError('System ID not found in request');
    }
    
    let result;
    
    // Determinar si es envío directo o por plantilla
    if (data.type === 'direct') {
      result = await emailService.sendDirectEmail({
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        html: data.html,
        text: data.text,
        attachments: data.attachments,
        metadata: data.metadata,
      }, systemId);
    } else {
      // Es envío por plantilla
      result = await emailService.sendTemplateEmail({
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        templateId: data.templateId,
        variables: data.variables,
        attachments: data.attachments,
        metadata: data.metadata,
      }, systemId);
    }
    
    if (result.success) {
      return res.status(202).json({
        message: 'Email queued for delivery',
        emailId: result.emailId,
        messageId: result.messageId,
      });
    } else {
      return res.status(500).json({
        error: 'Failed to send email',
        message: result.error,
        emailId: result.emailId,
      });
    }
  } catch (error) {
    next(error);
  }
}