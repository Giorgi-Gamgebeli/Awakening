import { db } from '@repo/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { env } from '../env';

const googleClientId = env.GOOGLE_CLIENT_ID;
const googleClientSecret = env.GOOGLE_CLIENT_SECRET;

const socialProviders = googleClientId &&
  googleClientSecret && {
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
        mapProfileToUser: () => {
          const randomId = crypto.randomUUID().replaceAll('-', '');
          const userName = `user_${randomId}`.slice(0, 32);
          const name = `display-name-${randomId}`.slice(0, 32);

          return {
            userName,
            name,
          };
        },
      },
    },
  };

export const auth = betterAuth({
  appName: env.VITE_APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  basePath: '/api/auth',
  trustedOrigins: [env.VITE_WEB_BASE_URL],
  database: prismaAdapter(db, { provider: 'postgresql' }),
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  ...socialProviders,
  user: {
    fields: {
      name: 'displayName',
    },
    additionalFields: {
      userName: {
        type: 'string',
        required: true,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const userName = user.userName;

          if (typeof userName === 'string' && userName.trim()) {
            const existing = await db.user.findUnique({
              where: { userName: userName.trim() },
              select: { id: true },
            });

            if (existing) {
              throw new APIError('BAD_REQUEST', {
                message: 'Username is already in use.',
              });
            }
          }

          return { data: user };
        },
      },
    },
  },
});
