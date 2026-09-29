import z from "zod";

export const CreateApiKeySchema = z.object({
  key: z.string(),
  userId: z.string(),
  provider: z.string(),
});
