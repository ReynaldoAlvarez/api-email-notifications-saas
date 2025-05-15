// src/lib/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';
import config from '../config';

// Definir formato personalizado
const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  if (Object.keys(metadata).length > 0) {
    metaStr = JSON.stringify(metadata);
  }
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Crear transporte para archivos rotativos (si se especifica una ruta)
const fileTransports = [];
if (config.logging.filePath) {
  fileTransports.push(
    new winston.transports.DailyRotateFile({
      filename: `${config.logging.filePath}/%DATE%-app.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: config.logging.level,
    })
  );
  
  // Transporte específico para errores
  fileTransports.push(
    new winston.transports.DailyRotateFile({
      filename: `${config.logging.filePath}/%DATE%-error.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    ...fileTransports,
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        myFormat
      ),
    }),
  ],
});

// En lugar de sobrescribir el método error, creamos una función wrapper
const originalError = logger.error.bind(logger);

// Reemplazar el método error con nuestra versión personalizada
logger.error = function(messageOrError: any, meta?: any): winston.Logger {
  if (messageOrError instanceof Error) {
    return originalError(messageOrError.message, {
      ...(meta || {}),
      stack: messageOrError.stack,
      name: messageOrError.name
    });
  }
  
  return originalError(messageOrError, meta);
};

export default logger;