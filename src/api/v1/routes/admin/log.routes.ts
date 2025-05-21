import { Router } from 'express';
import { getEmailLogsCtrl, getEmailLogCtrl, updateEmailLogStatusCtrl } from '../../controllers/admin/log.controller';
import { requireAuthorization, checkPermission } from '../../middlewares/requireAuthorization';

const router = Router();

// Obtener logs de correos
router.get('/', requireAuthorization, checkPermission('admin'), getEmailLogsCtrl);

// Obtener log de correo específico
router.get('/:id', requireAuthorization, checkPermission('admin'), getEmailLogCtrl as any);

// Actualizar estado de log de correo
router.put('/:id/status', requireAuthorization, checkPermission('admin'), updateEmailLogStatusCtrl as any);

export default router;