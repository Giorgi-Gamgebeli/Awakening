import { db } from '@repo/db';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import { TypeInput } from 'supertokens-node/types';
import { env } from './env';

const googleClientId = env.GOOGLE_CLIENT_ID;
const googleClientSecret = env.GOOGLE_CLIENT_SECRET;

function getFormField(input: { id: string; value: unknown }[], id: string) {
  const value = input.find((field) => field.id === id)?.value;
  return typeof value === 'string' ? value.trim() : '';
}

export const superTokensConfig: TypeInput & { framework: 'express' } = {
  framework: 'express',
  supertokens: {
    connectionURI: env.SUPERTOKENS_CONNECTION_URI,
  },
  appInfo: {
    appName: env.VITE_APP_NAME,
    apiDomain: env.VITE_SERVER_BASE_URL,
    websiteDomain: env.VITE_WEB_BASE_URL,
    apiBasePath: env.VITE_AUTH_BASE_PATH,
  },
  recipeList: [
    EmailPassword.init({
      signUpFeature: {
        formFields: [
          {
            id: 'userName',
            validate: async (value) => {
              const userName = typeof value === 'string' ? value.trim() : '';

              if (userName.length < 4)
                return 'Username must have at least 4 characters.';

              if (userName.length > 30)
                return 'Username must be less than 30 characters.';

              if (!/^\w+$/.test(userName))
                return 'Use letters, numbers, or underscores only.';

              const existingUser = await db.user.findUnique({
                where: { userName },
                select: { id: true },
              });

              if (existingUser) return 'Username is already in use.';

              return undefined;
            },
          },
          {
            id: 'displayName',
            validate: async (value) => {
              const displayName = typeof value === 'string' ? value.trim() : '';

              if (displayName.length < 4)
                return 'Display name must have at least 4 characters.';

              if (displayName.length > 30)
                return 'Display name must be less than 30 characters.';

              return undefined;
            },
          },
        ],
      },
      override: {
        apis: (originalImplementation) => ({
          ...originalImplementation,
          signUpPOST: async (input) => {
            if (!originalImplementation.signUpPOST)
              throw new Error('Email/password signup is not configured.');

            const response = await originalImplementation.signUpPOST(input);

            if (response.status !== 'OK') return response;

            await db.user.create({
              data: {
                id: response.user.id,
                email: getFormField(input.formFields, 'email'),
                userName: getFormField(input.formFields, 'userName'),
                displayName: getFormField(input.formFields, 'displayName'),
              },
            });

            return response;
          },
        }),
      },
    }),
    ThirdParty.init({
      signInAndUpFeature: {
        providers:
          googleClientId && googleClientSecret
            ? [
                {
                  config: {
                    thirdPartyId: 'google',
                    clients: [
                      {
                        clientId: googleClientId,
                        clientSecret: googleClientSecret,
                      },
                    ],
                  },
                },
              ]
            : [],
      },
    }),
    Session.init(),
  ],
};
