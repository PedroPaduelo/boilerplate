import dotenv from 'dotenv';
dotenv.config({ override: true });

import z from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  BASE_URL: z.string().url().default('http://localhost:4000'),

  // JWT
  JWT_SECRET: z.string(),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_PORT: z.coerce.number().default(6379),

  // Upload
  UPLOAD_DIR: z.string().optional(),
  MAX_FILE_SIZE: z.coerce.number().default(104857600), // 100MB
  UPLOAD_TIMEOUT: z.coerce.number().default(120000), // 2min
});

export type Env = z.infer<typeof envSchema>;

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:\n',
    _env.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
