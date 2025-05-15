// src/lib/sesClient.ts
import AWS from 'aws-sdk';
import config from '../config';
import logger from './logger';

// Configurar AWS SDK
AWS.config.update({
  region: config.aws.region,
  ...(config.aws.accessKeyId && config.aws.secretAccessKey ? {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  } : {}),
});

// Crear cliente SES
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// Interfaz para parámetros de envío de email
export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  configurationSet?: string;
  tags?: Record<string, string>;
}

/**
 * Envía un email usando AWS SES
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments = [],
  configurationSet = config.aws.ses.configurationSet,
  tags = {},
}: SendEmailParams): Promise<{ messageId: string }> {
  const recipients = Array.isArray(to) ? to : [to];
  
  // Construir el mensaje base
  const params: AWS.SES.SendEmailRequest = {
    Source: config.aws.ses.fromEmail,
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        ...(html && {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        }),
        ...(text && {
          Text: {
            Data: text,
            Charset: 'UTF-8',
          },
        }),
      },
    },
    ...(configurationSet && { ConfigurationSetName: configurationSet }),
    Tags: Object.entries(tags).map(([Name, Value]) => ({ Name, Value })),
  };

  // Si hay adjuntos, usar SendRawEmail en lugar de SendEmail
  if (attachments.length > 0) {
    // Aquí implementaríamos la lógica para enviar con adjuntos usando nodemailer
    // y AWS SES SendRawEmail, pero lo dejaremos para una implementación posterior
    logger.warn('Attachments functionality not yet implemented');
  }

  try {
    const result = await ses.sendEmail(params).promise();
    logger.info({ messageId: result.MessageId, to }, 'Email sent successfully');
    return { messageId: result.MessageId || '' };
  } catch (error) {
    logger.error(error, { params: { to, subject } });
    throw error;
  }
}

export default ses;