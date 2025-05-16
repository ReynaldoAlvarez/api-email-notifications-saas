import { Router } from 'express';
import { createTemplate, getTemplate, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { requireAuthorization, checkPermission } from '../middlewares/requireAuthorization';

const router = Router();

// Crear plantilla
router.post('/', requireAuthorization, createTemplate);

// Leer plantilla
router.get('/:id', requireAuthorization,  checkPermission("admin"), getTemplate as any);

// Actualizar plantilla
router.put('/:id', requireAuthorization,  checkPermission("admin"), updateTemplate as any);

// Eliminar plantilla
router.delete('/:id', requireAuthorization,  checkPermission("admin"), deleteTemplate as any);

export default router;