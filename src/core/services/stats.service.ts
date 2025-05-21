import { PrismaClient } from '@prisma/client';
import { EmailStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSystemStats(): Promise<any> {
  try {
    const stats = await prisma.authorizedSystem.findMany({
      select: {
        id: true,
        name: true,
        emailLogs: {
          select: {
            status: true
          }
        }
      }
    });

    return stats.map(system => ({
      id: system.id,
      name: system.name,
      emailStats: system.emailLogs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {} as Record<EmailStatus, number>)
    }));
  } catch (error:any) {
    throw new Error('Error getting system stats'+`${error}`);
  }
}

export async function getEmailStats(): Promise<any> {
  try {
    const stats = await prisma.emailLog.groupBy({
      by: ['status'],
      _count: true
    });
    console.log("STATS: ",stats)
    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<EmailStatus, number>);
  } catch (error:any) {
    throw new Error('Error getting email stats'+`${error}`);
  }
}