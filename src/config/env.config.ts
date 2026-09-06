import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/hospital_db?schema=public'),
  JWT_SECRET: z.string().default('hospital-jwt-secret-token-key-2026-antigravity'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  AI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_API_KEY: z.string().optional(),
  AI_API_KEY: z.string().default('mock-development-key'),
  AI_TEMPERATURE: z.coerce.number().default(0.2),
  WHATSAPP_API_KEY: z.string().default('mock-whatsapp-key'),
  SMS_GATEWAY_KEY: z.string().default('mock-sms-key'),
});

export const ENV = envSchema.parse(process.env);

