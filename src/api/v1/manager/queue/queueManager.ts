import { Queue, Worker } from 'bullmq';
import config from '../../../../config';
import { EmailJobData, EmailJobResult } from '../../validators/emailQueue';
import { sendDirectEmail, sendTemplateEmail } from '../../../../core/services/email.service';
import logger from '../../../../lib/logger';

// Crear la cola de correos
const emailQueue = new Queue<EmailJobData, EmailJobResult>('emailQueue', {
  connection: {
    url: config.redis.url,
  },
});

// Worker para procesar los trabajos de la cola
const emailWorker = new Worker<EmailJobData, EmailJobResult>('emailQueue', async (job) => {
  const { data, systemId } = job.data;

  let result;

  try {
    if (data.type === 'direct') {
      result = await sendDirectEmail({
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
      // Ensure templateId is defined when sending template email
      if (!data.templateId) {
        throw new Error('templateId is required for template emails');
      }
      
      result = await sendTemplateEmail({
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
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error('Failed to send email', { error, jobId: job.id });
    throw error;
  }
}, { connection: {
  url: config.redis.url,
} });

// Configurar reintentos
emailWorker.on('failed', (job: any, error: any) => {
  logger.error(`Job ${job.id} failed with error: ${error.message}`);
  job.retry({ delay: 5000 }); // Retraso de 5 segundos antes de reintentar
});

export { emailQueue };