// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './lib/logger';
import { errorConverter, errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requireAuthorization } from './api/v1/middlewares/requireAuthorization';
import emailRoutes from './api/v1/routes/email.routes';
import templateRoutes from './api/v1/routes/template.routes';
import en from 'zod/lib/locales/en';
import systemRoutes from './api/v1/routes/admin/system.routes';
import logRoutes from './api/v1/routes/admin/log.routes';
import statsRoutes from './api/v1/routes/admin/stats.routes';

// Crear aplicación Express
const app = express();

// Configurar middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de solicitudes HTTP
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.security.apiRateLimit, // límite por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});


// Aquí se importarán y usarán las rutas de la API
// app.use('/api/v1', apiRoutes);
app.get('/api/v1/auth-test', requireAuthorization, (req, res) => {
  res.json({
    message: 'Authentication successful',
    client: req.clientInfo
  });
});
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/template', templateRoutes);
app.use('/api/v1/admin/system', systemRoutes);
app.use('/api/v1/admin/log', logRoutes);
app.use('/api/v1/admin/stats', statsRoutes);
// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Convertir errores
app.use(errorConverter);

// Manejar errores
app.use(errorHandler);

export default app;

