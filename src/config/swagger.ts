import swaggerJsdoc from "swagger-jsdoc";
import { SwaggerDefinition } from "swagger-jsdoc";
import config from "./index";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Email API - Servicio de Correos Transaccionales",
    version: "1.0.0",

    description: `
    # LUMINIA SOFTWARE COMPANY
    ## Author: Ing. Vidal Alvarez
API completa para el envío de correos electrónicos transaccionales con soporte para:
- Envío directo de correos
- Plantillas dinámicas  
- Tracking de entregas
- Webhooks en tiempo real
- Analytics detallados
- Sistema de colas asíncrono con BullMQ

## Autenticación

Esta API utiliza dos tipos de autenticación:

### 1. JWT Bearer Token (Para gestión de cuenta)
Usado para endpoints de \`/auth\` y \`/account\`

### 2. API Keys (Para envío de correos)
Usado para endpoints de \`/email\`, \`/template\`, etc.
Requiere headers: \`X-Client-ID\` y \`X-API-Key\`

## Permisos Requeridos

Para envío de correos se requieren permisos específicos:

- **send_direct**: Para envío directo de correos
- **send_template**: Para envío usando plantillas

Los permisos se asignan automáticamente según el plan:

| Plan | Permisos Incluidos |
|------|-------------------|
| Free | send_basic, templates_basic, logs_basic |
| Basic | send_standard, analytics_basic |
| Pro | send_advanced, webhooks |
| Enterprise | send_unlimited |

## Rate Limiting

Los límites de velocidad varían según tu plan:

| Plan | Correos/Mes | Requests/Minuto |
|------|-------------|-----------------|
| Free | 100 | 10 |
| Basic | 1,000 | 60 |
| Pro | 10,000 | 120 |
| Enterprise | 100,000 | 300 |

## Sistema de Colas

Los correos se procesan de forma asíncrona usando:
- **BullMQ** para gestión de colas
- **Redis** como almacén de trabajos
- **AWS SES** para envío real

El endpoint devuelve inmediatamente un \`jobId\` para tracking.

## Archivos Adjuntos

- **Tamaño máximo**: 10MB por archivo
- **Formatos permitidos**: PDF, DOCX, PNG, JPEG, JPG
- **Codificación**: Base64
- **Validación**: Automática de tamaño y formato
`,
    contact: {
      name: "Soporte API",
      email: "soporte@tudominio.com",
      url: "https://tudominio.com/soporte",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: config.isDev
        ? `http://localhost:${config.port}`
        : "https://api.tudominio.com",
      description: config.isDev
        ? "Servidor de Desarrollo"
        : "Servidor de Producción",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT para autenticación de usuario",
      },
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API Key para autenticación de sistema",
      },
      ClientIdAuth: {
        type: "apiKey",
        in: "header",
        name: "X-Client-ID",
        description: "Client ID para identificación de sistema",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Mensaje de error",
          },
          message: {
            type: "string",
            description: "Descripción detallada del error",
          },
          statusCode: {
            type: "integer",
            description: "Código de estado HTTP",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "ID único del usuario",
          },
          firstName: {
            type: "string",
            description: "Nombre del usuario",
          },
          lastName: {
            type: "string",
            description: "Apellido del usuario",
          },
          email: {
            type: "string",
            format: "email",
            description: "Correo electrónico del usuario",
          },
          emailVerified: {
            type: "boolean",
            description: "Si el correo ha sido verificado",
          },
        },
      },
      Organization: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "ID único de la organización",
          },
          name: {
            type: "string",
            description: "Nombre de la organización",
          },
          slug: {
            type: "string",
            description: "Slug único de la organización",
          },
          description: {
            type: "string",
            nullable: true,
            description: "Descripción de la organización",
          },
          website: {
            type: "string",
            format: "uri",
            nullable: true,
            description: "Sitio web de la organización",
          },
          industry: {
            type: "string",
            nullable: true,
            description: "Industria de la organización",
          },
          role: {
            type: "string",
            enum: ["OWNER", "ADMIN", "MEMBER"],
            description: "Rol del usuario en la organización",
          },
        },
      },

      // Actualizar el esquema EmailRequest para que coincida exactamente con tu validador:
      EmailRequest: {
        type: "object",
        discriminator: {
          propertyName: "type",
        },
        oneOf: [
          { $ref: "#/components/schemas/DirectEmailRequest" },
          { $ref: "#/components/schemas/TemplateEmailRequest" },
        ],
      },

      DirectEmailRequest: {
        type: "object",
        required: ["type", "to", "subject"],
        properties: {
          type: {
            type: "string",
            enum: ["direct"],
            description: "Tipo de envío directo",
          },
          to: {
            oneOf: [
              {
                type: "string",
                format: "email",
                example: "usuario@ejemplo.com",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  format: "email",
                },
                example: ["usuario1@ejemplo.com", "usuario2@ejemplo.com"],
              },
            ],
            description: "Destinatario(s) del correo",
          },
          cc: {
            oneOf: [
              {
                type: "string",
                format: "email",
                example: "supervisor@ejemplo.com",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  format: "email",
                },
              },
            ],
            description: "Destinatario(s) en copia (opcional)",
          },
          bcc: {
            oneOf: [
              {
                type: "string",
                format: "email",
                example: "admin@ejemplo.com",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  format: "email",
                },
              },
            ],
            description: "Destinatario(s) en copia oculta (opcional)",
          },
          subject: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            description: "Asunto del correo (requerido)",
            example: "Bienvenido a nuestro servicio",
          },
          html: {
            type: "string",
            description:
              "Contenido HTML del correo (opcional si se proporciona text)",
            example: "<h1>¡Hola!</h1><p>Gracias por registrarte.</p>",
          },
          text: {
            type: "string",
            description:
              "Contenido de texto plano del correo (opcional si se proporciona html)",
            example: "¡Hola!\n\nGracias por registrarte.",
          },
          attachments: {
            type: "array",
            items: { $ref: "#/components/schemas/Attachment" },
            description:
              "Archivos adjuntos (opcional, máximo 10MB por archivo)",
          },
          metadata: {
            type: "object",
            additionalProperties: true,
            description: "Metadatos adicionales para tracking (opcional)",
            example: {
              campaign: "welcome-series",
              userId: "12345",
            },
          },
        },
      },

      TemplateEmailRequest: {
        type: "object",
        required: ["type", "to", "templateId", "variables"],
        properties: {
          type: {
            type: "string",
            enum: ["template"],
            description: "Tipo de envío con plantilla",
          },
          to: {
            oneOf: [
              {
                type: "string",
                format: "email",
                example: "usuario@ejemplo.com",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  format: "email",
                },
              },
            ],
            description: "Destinatario(s) del correo",
          },
          cc: {
            oneOf: [
              {
                type: "string",
                format: "email",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  format: "email",
                },
              },
            ],
            description: "Destinatario(s) en copia (opcional)",
          },
          bcc: {
            oneOf: [
              {
                type: "string",
                format: "email",
              },
              {
                type: "array",
                items: {
                  type: "string",
                  format: "email",
                },
              },
            ],
            description: "Destinatario(s) en copia oculta (opcional)",
          },
          templateId: {
            type: "string",
            format: "uuid",
            description: "ID de la plantilla a utilizar (requerido)",
            example: "123e4567-e89b-12d3-a456-426614174000",
          },
          variables: {
            type: "object",
            additionalProperties: true,
            description:
              "Variables para reemplazar en la plantilla (requerido)",
            example: {
              nombre: "Juan Pérez",
              empresa: "Mi Empresa",
              enlace_activacion: "https://miapp.com/activate/abc123",
            },
          },
          attachments: {
            type: "array",
            items: { $ref: "#/components/schemas/Attachment" },
            description: "Archivos adjuntos (opcional)",
          },
          metadata: {
            type: "object",
            additionalProperties: true,
            description: "Metadatos adicionales (opcional)",
            example: {
              campaign: "user-activation",
              source: "registration-form",
            },
          },
        },
      },

      Attachment: {
        type: "object",
        required: ["filename", "content"],
        properties: {
          filename: {
            type: "string",
            minLength: 1,
            description: "Nombre del archivo (requerido)",
            example: "documento.pdf",
          },
          content: {
            type: "string",
            format: "base64",
            minLength: 1,
            description: "Contenido del archivo en Base64 (requerido)",
            example: "JVBERi0xLjQKJcOkw7zDtsO...",
          },
          contentType: {
            type: "string",
            description: "Tipo MIME del archivo (opcional)",
            example: "application/pdf",
          },
          size: {
            type: "integer",
            maximum: 10485760,
            description: "Tamaño del archivo en bytes (opcional, máximo 10MB)",
            example: 1024000,
          },
          format: {
            type: "string",
            enum: ["pdf", "docx", "png", "jpeg", "jpg"],
            description:
              "Formato del archivo (opcional, debe ser uno de los permitidos)",
            example: "pdf",
          },
        },
      },

      EmailJobResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Mensaje de confirmación",
            example: "Email queued for delivery",
          },
          jobId: {
            type: "string",
            description: "ID del trabajo en la cola BullMQ para tracking",
            example: "job_123e4567-e89b-12d3-a456-426614174000",
          },
        },
      },
    },
    Plan: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre del plan",
        },
        slug: {
          type: "string",
          description: "Slug del plan",
        },
        emailsPerMonth: {
          type: "integer",
          description: "Límite de correos por mes",
        },
      },
    },
    Subscription: {
      type: "object",
      properties: {
        plan: {
          $ref: "#/components/schemas/Plan",
        },
        status: {
          type: "string",
          enum: ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"],
          description: "Estado de la suscripción",
        },
      },
    },
    ApiCredentials: {
      type: "object",
      properties: {
        clientId: {
          type: "string",
          format: "uuid",
          description: "Client ID para usar en X-Client-ID",
        },
        apiKey: {
          type: "string",
          description: "API Key para usar en X-API-Key",
        },
        systemName: {
          type: "string",
          description: "Nombre del sistema autorizado",
        },
      },
    },
    ApiKeyInfo: {
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "ID del sistema autorizado",
        },
        name: {
          type: "string",
          description: "Nombre del sistema",
        },
        description: {
          type: "string",
          nullable: true,
          description: "Descripción del sistema",
        },
        isActive: {
          type: "boolean",
          description: "Si el sistema está activo",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          description: "Fecha de creación",
        },
        lastUsed: {
          type: "string",
          format: "date-time",
          nullable: true,
          description: "Fecha del último uso",
        },
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "Endpoints para registro, login y gestión de autenticación",
    },
    {
      name: "Account",
      description: "Gestión de perfil de usuario y organizaciones",
    },
    {
      name: "Email",
      description: "Envío de correos electrónicos",
    },
    {
      name: "Templates",
      description: "Gestión de plantillas de correo",
    },
    {
      name: "Admin",
      description: "Endpoints administrativos (requiere permisos especiales)",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    "./src/api/v1/routes/*.ts",
    "./src/api/v1/routes/**/*.ts",
    "./src/api/v1/controllers/*.ts",
    "./src/api/v1/controllers/**/*.ts",
  ],
};

export const specs = swaggerJsdoc(options);
