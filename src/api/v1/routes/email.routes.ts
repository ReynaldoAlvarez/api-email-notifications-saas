import { NextFunction, Router, Request,Response } from 'express';
import { sendEmailHandler } from '../controllers/email.controller';
import { requireAuthorization, checkPermission } from '../middlewares/requireAuthorization';

const router = Router();

// Ruta para enviar correo (verifica permisos según el tipo de envío)
router.post('/send', requireAuthorization, (req: Request, res: Response, next: NextFunction): void => {
  // Determinar el tipo de envío y verificar el permiso correspondiente
  const isTemplateEmail = req.body.type === 'template';
  const requiredPermission = isTemplateEmail ? 'send_template' : 'send_direct';
  
  // Verificar que el cliente tiene el permiso requerido
  if (!req.clientInfo?.permissions.includes(requiredPermission)) {
     res.status(403).json({
      error: `Missing required permission: ${requiredPermission}`
    });
  }
  
  next();
}, sendEmailHandler as any);

export default router;