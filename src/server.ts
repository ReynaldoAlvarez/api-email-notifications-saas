// src/server.ts
import app from './app';
import config from './config';
import logger from './lib/logger';
import prisma from './lib/prisma';

async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    logger.info('Connected to database');

    // Iniciar el servidor
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`Health check available at http://localhost:${config.port}/health`);
    });

    // Manejo de señales para cierre graceful
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server shut down successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Manejo de excepciones no capturadas
    process.on('uncaughtException', (error:any) => {
      logger.error(error, 'Uncaught Exception');
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason:any) => {
      logger.error(reason, 'Unhandled Rejection');
      process.exit(1);
    });
  } catch (error:any) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();