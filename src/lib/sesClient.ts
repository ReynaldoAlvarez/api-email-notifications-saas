import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
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

// Crear transporte de nodemailer usando SES
const transporter = nodemailer.createTransport({
  SES: { ses, aws: AWS }
});

// Interfaz para parámetros de envío de email
export interface SendEmailParams {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
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
  cc,
  bcc,
  subject,
  html,
  text,
  attachments = [],
  configurationSet = config.aws.ses.configurationSet,
  tags = {},
}: SendEmailParams): Promise<{ messageId: string }> {
  // Si hay adjuntos, usar nodemailer con SendRawEmail
  if (attachments.length > 0) {
    return sendEmailWithAttachments({
      to, cc, bcc, subject, html, text, attachments, configurationSet, tags
    });
  }

  // Sin adjuntos, usar SendEmail directamente
  const recipients = Array.isArray(to) ? to : [to];
  
  // Construir el mensaje base
  const params: AWS.SES.SendEmailRequest = {
    Source: config.aws.ses.fromEmail,
    Destination: {
      ToAddresses: recipients,
      ...(cc && { CcAddresses: Array.isArray(cc) ? cc : [cc] }),
      ...(bcc && { BccAddresses: Array.isArray(bcc) ? bcc : [bcc] }),
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

  try {
    const result = await ses.sendEmail(params).promise();
    logger.info(`Email sent successfully: ${result.MessageId}`, { messageId: result.MessageId, to });
    return { messageId: result.MessageId || '' };
  } catch (error: any) {
    logger.error(error, { params: { to, subject } });
    throw error;
  }
}

/**
 * Envía un email con adjuntos usando nodemailer y SES SendRawEmail
 */
async function sendEmailWithAttachments({
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  attachments,
  configurationSet,
  tags ={}
,}: SendEmailParams): Promise<{ messageId: string }> {
  try {
    // Preparar las opciones de correo para nodemailer
    const mailOptions: Mail.Options = {
      from: config.aws.ses.fromEmail,
      to: Array.isArray(to) ? to.join(',') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(',') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(',') : bcc) : undefined,
      subject,
      html,
      text,
      attachments,
      headers: {},
    };

    // Añadir cabecera de Configuration Set si está definido
    if (configurationSet) {
      mailOptions.headers = {
        ...mailOptions.headers,
        'X-SES-CONFIGURATION-SET': configurationSet,
      };
    }

    // Añadir tags como cabeceras personalizadas
    if (Object.keys(tags).length > 0) {
      Object.entries(tags).forEach(([key, value]) => {
        mailOptions.headers = {
          ...mailOptions.headers,
          [`X-SES-MESSAGE-TAGS-${key}`]: value,
        };
      });
    }

    // Enviar el correo usando nodemailer
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email with attachments sent successfully: ${info.messageId}`, { 
      messageId: info.messageId, 
      to, 
      attachments: attachments?.map(a => a.filename) 
    });
    
    return { messageId: info.messageId || '' };
  } catch (error) {
    logger.error('Error sending email with attachments', { error, to, subject });
    throw error;
  }
}

export default ses;