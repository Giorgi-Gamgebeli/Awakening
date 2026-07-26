import { z } from '@repo/zod';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });

const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const environmentSchema = z
  .object({
    SERVER_PORT: z.coerce.number().int().positive().default(3000),
    SUPERTOKENS_CONNECTION_URI: z.url(),
    VITE_APP_NAME: z.string().trim().min(1),
    VITE_SERVER_BASE_URL: z.url(),
    VITE_WEB_BASE_URL: z.url(),
    VITE_AUTH_BASE_PATH: z.string().startsWith('/'),
    GOOGLE_CLIENT_ID: optionalSecret,
    GOOGLE_CLIENT_SECRET: optionalSecret,
  })
  .refine(
    ({ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET }) =>
      Boolean(GOOGLE_CLIENT_ID) === Boolean(GOOGLE_CLIENT_SECRET),
    'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be provided together.',
  );

export const env = environmentSchema.parse(process.env);
