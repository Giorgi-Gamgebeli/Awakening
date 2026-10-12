import { oc } from "@orpc/contract";
import { z } from "zod";

export const ApiKeysProviderSchema = z.enum(["GEMINI", "OPENAI", "ANTHROPIC"]);

export const ApiKeysCreateInputSchema = z.object({
  key: z.string().min(1),
  provider: ApiKeysProviderSchema,
  label: z.string().trim().max(50).optional(),
});

export const ApiKeysCreateOutputSchema = z.object({
  id: z.number().int().positive(),
  // The database previously allowed custom labels, so persisted legacy keys can
  // still be listed. New and updated keys are restricted by the input schema.
  provider: z.string(),
  label: z.string().nullable(),
  selectedModel: z.string().nullable(),
  isActive: z.boolean(),
});

export const ApiKeysPatchInputSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    provider: ApiKeysProviderSchema.optional(),
    label: z.string().trim().max(50).nullable().optional(),
    selectedModel: z.string().trim().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    ({ provider, label, selectedModel, isActive }) =>
      provider !== undefined ||
      label !== undefined ||
      selectedModel !== undefined ||
      isActive !== undefined,
    { message: "Provide at least one field to update." },
  );

export const ApiKeysDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ApiKeysFindManyOutputSchema = z.array(ApiKeysCreateOutputSchema);

export const ApiKeysPatchOutputSchema = ApiKeysCreateOutputSchema;

export const apiKeysContract = {
  create: oc
    .route({ method: "POST", path: "/api-keys" })
    .input(ApiKeysCreateInputSchema)
    .output(ApiKeysCreateOutputSchema),
  findMany: oc
    .route({ method: "GET", path: "/api-keys" })
    .output(ApiKeysFindManyOutputSchema),
  patch: oc
    .route({ method: "PATCH", path: "/api-keys/{id}" })
    .input(ApiKeysPatchInputSchema)
    .output(ApiKeysPatchOutputSchema),
  delete: oc
    .route({ method: "DELETE", path: "/api-keys/{id}" })
    .input(ApiKeysDeleteSchema)
    .output(ApiKeysDeleteSchema),
};
