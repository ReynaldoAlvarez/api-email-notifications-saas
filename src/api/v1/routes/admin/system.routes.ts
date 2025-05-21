import { Router } from 'express';
import { createAuthorizedSystemCtrl, getAuthorizedSystemCtrl, updateAuthorizedSystemCtrl, deleteAuthorizedSystemCtrl } from '../../controllers/admin/system.controller';
import { requireAuthorization, checkPermission } from '../../middlewares/requireAuthorization';

const router = Router();

// Crear sistema autorizado
router.post('/', requireAuthorization, checkPermission('admin'), createAuthorizedSystemCtrl);

// Leer sistema autorizado
router.get('/:id', requireAuthorization, checkPermission('admin'), getAuthorizedSystemCtrl as any);

// Actualizar sistema autorizado
router.put('/:id', requireAuthorization, checkPermission('admin'), updateAuthorizedSystemCtrl as any);

// Eliminar sistema autorizado
router.delete('/:id', requireAuthorization, checkPermission('admin'), deleteAuthorizedSystemCtrl as any);

export default router;