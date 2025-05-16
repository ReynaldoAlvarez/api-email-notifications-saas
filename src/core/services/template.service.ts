import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import { EmailTemplateType } from '../../api/v1/validators/template.validators'

/**
 * Renderiza una plantilla con las variables proporcionadas
 */
export async function renderTemplate(
  templateId: string,
  variables: Record<string, any>
) {
  try {
    // Buscar la plantilla en la base de datos
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        isActive: true,
      },
    });

    if (!template) {
      logger.warn(`Template not found or inactive: ${templateId}`);
      return null;
    }

    // Función simple para reemplazar variables en un string
    // En una implementación real, usaríamos un motor de plantillas como Handlebars
    const replaceVariables = (text: string, vars: Record<string, any>) => {
      return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        return vars[trimmedKey] !== undefined ? String(vars[trimmedKey]) : match;
      });
    };

    // Renderizar el asunto y el contenido
    const subject = replaceVariables(template.subject, variables);
    const html = template.contentHtml ? replaceVariables(template.contentHtml, variables) : undefined;
    const text = template.contentText ? replaceVariables(template.contentText, variables) : undefined;

    return {
      subject,
      html,
      text,
    };
  } catch (error) {
    logger.error('Error rendering template', { error, templateId });
    throw error;
  }
}



// Crear plantilla
export const createEmailTemplate = async (name: string, subject: string, contentHtml: string, contentText?: string, variables?: string[]): Promise<EmailTemplateType> => {
  const template = await prisma.emailTemplate.create({
    data: {
      name,
      subject,
      contentHtml,
      contentText: contentText || "",
      variables: variables || [],
      isActive: true
    }
  });
  
  // Ensure the return type matches EmailTemplateType by explicitly constructing the object
  return {
    name: template.name,
    subject: template.subject,
    contentHtml: template.contentHtml,
    contentText: template.contentText || "", // Ensure contentText is always a string
    variables: template.variables,
    isActive: template.isActive
  };
};

// Leer plantilla
export const getEmailTemplate = async (id: string): Promise<EmailTemplateType | null> => {
  const template = await prisma.emailTemplate.findUnique({
    where: { id }
  });
  
  if (!template) return null;
  
  return {
    name: template.name,
    subject: template.subject,
    contentHtml: template.contentHtml,
    contentText: template.contentText || "", // Ensure contentText is always a string
    variables: template.variables,
    isActive: template.isActive
  };
};

// Actualizar plantilla
export const updateEmailTemplate = async (id: string, name: string, subject: string, contentHtml: string, contentText?: string, variables?: string[]): Promise<EmailTemplateType | null> => {
  const template = await prisma.emailTemplate.update({
    where: { id },
    data: {
      name,
      subject,
      contentHtml,
      contentText,
      variables: variables || [],
      updatedAt: new Date()
    }
  });
  
  return {
    name: template.name,
    subject: template.subject,
    contentHtml: template.contentHtml,
    contentText: template.contentText || "", // Ensure contentText is always a string
    variables: template.variables,
    isActive: template.isActive
  };
};

// Eliminar plantilla
export const deleteEmailTemplate = async (id: string): Promise<EmailTemplateType | null> => {
  const template = await prisma.emailTemplate.delete({
    where: { id }
  });
  
  return {
    name: template.name,
    subject: template.subject,
    contentHtml: template.contentHtml,
    contentText: template.contentText || "", // Ensure contentText is always a string
    variables: template.variables,
    isActive: template.isActive
  };
};
