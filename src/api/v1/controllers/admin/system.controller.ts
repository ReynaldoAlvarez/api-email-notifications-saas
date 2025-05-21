import { Request, Response, NextFunction } from 'express';
import { createAuthorizedSystem, findAuthorizedSystemById, updateAuthorizedSystem, deleteAuthorizedSystem } from '../../../../core/services/authorizedSystem.service';
import { ApiError } from '../../../../errors/ApiError';

export const createAuthorizedSystemCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, permissionCodes, allowedOrigins } = req.body;
    const result = await createAuthorizedSystem(name, description, permissionCodes, allowedOrigins);
    res.status(201).json(result);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};

export const getAuthorizedSystemCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const system = await findAuthorizedSystemById(id);
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }
    res.json(system);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};

export const updateAuthorizedSystemCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, permissionCodes, allowedOrigins, isActive } = req.body;
    console.log("-------------")
    const system = await updateAuthorizedSystem(id, name, description, permissionCodes, allowedOrigins, isActive);
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }
    res.json(system);
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};

export const deleteAuthorizedSystemCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const system = await deleteAuthorizedSystem(id);
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }
    res.json({ message: 'System deleted successfully' });
  } catch (error:any) {
    next(new ApiError(500, error.message));
  }
};