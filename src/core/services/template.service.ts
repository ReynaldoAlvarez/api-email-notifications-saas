import prisma from '../../lib/prisma';
import logger from '../../lib/logger';

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