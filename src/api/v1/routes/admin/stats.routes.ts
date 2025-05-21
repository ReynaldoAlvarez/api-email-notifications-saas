import { Router } from 'express';
import { getSystemStatsCtrl, getEmailStatsCtrl } from '../../controllers/admin/stats.controller';
import { requireAuthorization, checkPermission } from '../../middlewares/requireAuthorization';

const router = Router();

// Obtener estadísticas de sistemas
router.get('/systems', requireAuthorization, checkPermission('admin'), getSystemStatsCtrl);

// Obtener estadísticas de correos
router.get('/emails', requireAuthorization, checkPermission('admin'), getEmailStatsCtrl);

export default router;