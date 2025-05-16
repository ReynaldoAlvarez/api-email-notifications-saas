import { Request, Response } from 'express';
import { createEmailTemplate, getEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '../../../core/services/template.service';

// Crear plantilla
export const createTemplate = async (req: Request, res: Response) => {
  try {
    console.log("----------------")
    const { name, subject, contentHtml, contentText, variables } = req.body;
    const template = await createEmailTemplate(name, subject, contentHtml, contentText, variables);
    res.status(201).json(template);
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

// Leer plantilla
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await getEmailTemplate(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar plantilla
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subject, contentHtml, contentText, variables } = req.body;
    const template = await updateEmailTemplate(id, name, subject, contentHtml, contentText, variables);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar plantilla
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await deleteEmailTemplate(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};