import { EmailLog, EmailStatus, Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import logger from '../../lib/logger';

/**
 * Crea un registro inicial para un correo electrónico
 */
export async function createInitialLog(data: {
  to: string;
  subject: string;
  body?: string;
  systemId: string;
  templateId?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
}): Promise<EmailLog> {
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        to: data.to,
        subject: data.subject,
        body: data.body,
        status: EmailStatus.PENDING,
        systemId: data.systemId,
        templateId: data.templateId,
        // Corregir el tipo para attachments
        attachments: data.attachments ? data.attachments as Prisma.InputJsonValue : undefined,
        // Corregir el tipo para metadata
        metadata: data.metadata ? data.metadata as Prisma.InputJsonValue : undefined,
       },
    });

    logger.info(`Created initial email log: ${emailLog.id}`);
    return emailLog;
  } catch (error) {
    logger.error('Error creating email log', { error, data });
    throw error;
  }
}

/**
 * Actualiza el estado de un registro de correo electrónico
 */
export async function updateLogStatus(
  logId: string,
  status: EmailStatus,
  data?: {
    error?: string;
    metadata?: Record<string, any>;
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
  }
): Promise<EmailLog> {
  try {
    const currentLog = await prisma.emailLog.findUnique({
      where: { id: logId },
    });

    if (!currentLog) {
      throw new Error(`Email log not found: ${logId}`);
    }

    // Combinar metadata existente con nueva metadata
    let updatedMetadata = currentLog.metadata as Record<string, any> || {};
    if (data?.metadata) {
      updatedMetadata = { ...updatedMetadata, ...data.metadata };
    }

    const emailLog = await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status,
        error: data?.error,
        metadata: updatedMetadata as Prisma.InputJsonValue,
       sentAt: data?.sentAt,
        deliveredAt: data?.deliveredAt,
        openedAt: data?.openedAt,
        clickedAt: data?.clickedAt,
      },
    });

    logger.info(`Updated email log status: ${logId} -> ${status}`);
    return emailLog;
  } catch (error) {
    logger.error('Error updating email log', { error, logId, status });
    throw error;
  }
}



/**
 * Actualiza un registro de correo con información de error
 */
export async function updateLogError(
  logId: string,
  error: Error | string
): Promise<EmailLog> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  try {
    const emailLog = await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: EmailStatus.FAILED,
        error: errorMessage,
      },
    });

    logger.info(`Updated email log with error: ${logId}`);
    return emailLog;
  } catch (dbError) {
    logger.error('Error updating email log with error', { error: dbError, logId, errorMessage });
    throw dbError;
  }
}
export async function getEmailLogs(): Promise<EmailLog[]> {
  try {
    const logs = await prisma.emailLog.findMany();
    return logs;
  } catch (error) {
    logger.error('Error getting email logs', { error });
    throw error;
  }
}

export async function getEmailLog(id: string): Promise<EmailLog | null> {
  try {
    const log = await prisma.emailLog.findUnique({
      where: { id },
    });
    return log;
  } catch (error) {
    logger.error('Error getting email log', { error, id });
    throw error;
  }
}