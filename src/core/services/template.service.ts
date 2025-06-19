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
export const createEmailTemplate = async (name: string, subject: string, contentHtml: string, contentText?: string, variables?: string[], systemId?:string): Promise<EmailTemplateType> => {
  
  const template = await prisma.emailTemplate.create({
    data: {
      name,
      subject,
      contentHtml,
      contentText: contentText || "",
      variables: variables || [],
      isActive: true,
      systemId: systemId
    }
  });
  
  // Ensure the return type matches EmailTemplateType by explicitly constructing the object
  return {
    name: template.name,
    subject: template.subject,
    contentHtml: template.contentHtml,
    contentText: template.contentText || "", // Ensure contentText is always a string
    variables: template.variables,
    isActive: template.isActive,
    systemId: template.systemId || "",
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
    systemId: template.systemId || "",
    variables: template.variables,
    isActive: template.isActive
  };
};


export const getEmailTemplateBySystemId = async (systemId: string): Promise<EmailTemplateType[]> => {
  const templates = await prisma.emailTemplate.findMany({
    where: {
      systemId
    }
  });
  if (!templates.length) return [];
  return templates.map(template => ({
    name: template.name,
    subject: template.subject,
    contentHtml: template.contentHtml,
    contentText: template.contentText || "", // Convert null to empty string
    variables: template.variables,
    isActive: template.isActive,
    systemId: template.systemId || "", // Convert null to empty string
  }));
};  
// leer plantilla por nombre y id del sistema
export const getEmailTemplateByNameAndId = async (name: string, id:string):Promise<EmailTemplateType | null> => {
const data = await prisma.emailTemplate.findFirst({
  where: {
    name,
    systemId: id
  }
  });  
  if (!data) return null;
  return {
    name: data.name,
    subject: data.subject,
    contentHtml: data.contentHtml,
    contentText: data.contentText || "", // Ensure contentText is always a string
    variables: data.variables,
    systemId: data.systemId || "",
    isActive: data.isActive
  };
}
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
    isActive: template.isActive,
    systemId: template.systemId || "",
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
    isActive: template.isActive,
    systemId: template.systemId || "",
  };
};
