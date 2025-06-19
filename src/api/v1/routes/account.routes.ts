import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getOrganizations,
  createOrganization,
  getApiKeys,
  regenerateApiKey,
} from '../controllers/account.controller';
import { requireUserAuth } from '../middlewares/requireUserAuth';

const router = Router();

// Todas las rutas de cuenta requieren autenticación JWT
router.use(requireUserAuth);

// Rutas de perfil
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Rutas de organizaciones
router.get('/organizations', getOrganizations);
router.post('/organizations', createOrganization);

// Rutas de API keys
router.get('/organizations/:organizationId/api-keys', getApiKeys);
router.post('/api-keys/regenerate', regenerateApiKey);

export default router;