import { Request, Response } from 'express';
import { createEmailTemplate, getEmailTemplate, updateEmailTemplate, deleteEmailTemplate, getEmailTemplateByNameAndId, getEmailTemplateBySystemId } from '../../../core/services/template.service';

// Crear plantilla
export const createTemplate = async (req: Request, res: Response) => {
  try {
    console.log("----------------")
    const { name, subject, contentHtml, contentText, variables } = req.body;
    
    console.log(name , req.clientInfo?.id)
    const nameTemplate = await getEmailTemplateByNameAndId(name , req.clientInfo?.id as string);
    console.log("name template:",nameTemplate)
    if (nameTemplate) {
        return res.status(400).json({ error: "Name Template with the same name already exists." });
    }
    const systemId = req.clientInfo?.id as string;
    const template = await createEmailTemplate(name, subject, contentHtml, contentText, variables, systemId);
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
// Leer plantilla
export const getTemplateBySystemId = async (req: Request, res: Response) => {
    try {
      console.log("------------ systemId")
        const systemId = req.clientInfo?.id as string;
        const templates = await getEmailTemplateBySystemId(systemId);
        if (!templates || templates.length === 0) {
            return res.status(404).json({ error: 'No templates found for the system' });
        }
        res.json(templates);
    } catch (error: any) {
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