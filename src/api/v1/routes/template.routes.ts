import { Router } from 'express';
import { createTemplate, getTemplate, updateTemplate, deleteTemplate,getTemplateBySystemId } from '../controllers/template.controller';
import { requireAuthorization, checkPermission } from '../middlewares/requireAuthorization';

const router = Router();

// Crear plantilla
router.post('/', requireAuthorization, createTemplate as any);

// Leer plantilla
router.get('/:id', requireAuthorization,   getTemplate as any);

// Actualizar plantilla
router.put('/:id', requireAuthorization,  /* checkPermission("admin"),  */updateTemplate as any);

// Eliminar plantilla
router.delete('/:id', requireAuthorization,  /* checkPermission("admin"), */ deleteTemplate as any);

// Leer plantillas por systema autorizado
router.get('/system/allsystem', requireAuthorization,/* checkPermission("admin"), */getTemplateBySystemId as any);

export default router;