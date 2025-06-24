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
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import emailRoutes from './api/v1/routes/email.routes';
import templateRoutes from './api/v1/routes/template.routes';
import systemRoutes from './api/v1/routes/admin/system.routes';
import logRoutes from './api/v1/routes/admin/log.routes';
import statsRoutes from './api/v1/routes/admin/stats.routes';
// Importar nuevas rutas SaaS
import authRoutes from './api/v1/routes/auth.routes';
import accountRoutes from './api/v1/routes/account.routes';

console.log("add")
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

// Documentación Swagger (solo en desarrollo o si está habilitado)
if (config.isDev || process.env.ENABLE_DOCS === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Email API - Documentación',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));
  
  // Endpoint para obtener el spec JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env,
    documentation: config.isDev ? `http://localhost:${config.port}/api-docs` : 'https://api.tudominio.com/api-docs'
  });
});


// Aquí se importarán y usarán las rutas de la API
// Rutas públicas de autenticación (SaaS)
app.use('/api/v1/auth', authRoutes);

// Rutas autenticadas de cuenta (SaaS)
app.use('/api/v1/account', accountRoutes);
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

