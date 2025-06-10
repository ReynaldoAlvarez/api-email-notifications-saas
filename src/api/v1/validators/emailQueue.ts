import { EmailStatus } from '@prisma/client';

// Tipo de datos para el trabajo de envío de correo
export type EmailJobData = {
  data: {
    type: 'direct' | 'template';
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
    templateId?: string;
    variables?: Record<string, any>;
  };
  systemId: string;
};

// Tipo de resultado del trabajo de envío de correo
export type EmailJobResult = {
  success: boolean;
  emailId?: string;
  messageId?: string;
  error?: string;
};