import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { env } from "../env";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_BASE_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        userName: { type: "string", required: true },
      },
    }),
  ],
});
