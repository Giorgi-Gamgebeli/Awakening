import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        userName: { type: "string", required: true },
      },
    }),
  ],
});
