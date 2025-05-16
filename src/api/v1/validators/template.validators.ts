import { z } from 'zod';

export const EmailTemplate = z.object({
  name: z.string().min(1, "Name is required"),
    subject: z.string().min(1, "Subject is required"),
    contentHtml: z.string().min(1, "HTML content is required"),
    contentText: z.string().min(1, "Text content is required"),
    variables: z.array(z.string(), z.string()),
    isActive: z.boolean()
});

// inferir tipado
export type EmailTemplateType = z.infer<typeof EmailTemplate>;
