import { z } from "@repo/zod";

const environmentSchema = z.object({
  VITE_SERVER_BASE_URL: z.url(),
});

export const env = environmentSchema.parse(import.meta.env);
