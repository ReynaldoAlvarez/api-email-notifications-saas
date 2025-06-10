import { Request, Response, NextFunction } from 'express';
import { sendEmailSchema } from '../validators/email.validators';
import { emailQueue } from '../../v1/manager/queue/queueManager';

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
     // Verificar que el subject esté definido solo para emails directos
     if (data.type === 'direct' && !data.subject) {
      throw new BadRequestError('Subject is required for direct emails');
    }
    
    // Preparar los datos para la cola, asegurando que siempre haya un subject
    let queueData;
    
    if (data.type === 'direct') {
      // Para emails directos, usamos los datos tal cual
      queueData = data;
    } else {
      // Para emails de plantilla, añadimos un subject por defecto
      queueData = {
        ...data,
        subject: `Template Email: ${data.templateId}`
      };
    }
    
    const job = await emailQueue.add('emailJob', { data: queueData, systemId });
    let result;
    
    // Determinar si es envío directo o por plantilla
    return res.status(202).json({
      message: 'Email queued for delivery',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
}
