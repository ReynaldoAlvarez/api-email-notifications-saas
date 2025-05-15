// src/config/index.ts

import { z } from 'zod';

import dotenv from 'dotenv';

// Cargar variables de .env
dotenv.config();


// Esquema de validación para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  
  // AWS SES
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SES_FROM_EMAIL: z.string().email(),
  AWS_SES_CONFIGURATION_SET: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().optional(),
  API_RATE_LIMIT: z.string().transform(val => parseInt(val, 10)).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_FILE_PATH: z.string().optional(),
});

// Validar y exportar configuración
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:', result.error.format());
  throw new Error('Invalid environment configuration');
}

const env = result.data;

export default {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  db: {
    url: env.DATABASE_URL,
  },
  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    ses: {
      fromEmail: env.AWS_SES_FROM_EMAIL,
      configurationSet: env.AWS_SES_CONFIGURATION_SET,
    },
  },
  security: {
    jwtSecret: env.JWT_SECRET,
    apiRateLimit: env.API_RATE_LIMIT,
  },
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};