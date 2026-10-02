import { oc } from "@orpc/contract";
import { z } from "zod";

export const ApiKeysPurposeSchema = z.enum(["AGENT", "TRANSLATION"]);

export const ApiKeysCreateInputSchema = z.object({
  key: z.string().min(1),
  provider: z.string().trim().min(1),
  purpose: ApiKeysPurposeSchema,
});

export const ApiKeysCreateOutputSchema = z.object({
  id: z.number().int().positive(),
  provider: z.string(),
  purpose: ApiKeysPurposeSchema,
});

export const ApiKeysPatchInputSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    provider: z.string().trim().min(1).optional(),
    purpose: ApiKeysPurposeSchema.optional(),
  })
  .refine(
    ({ provider, purpose }) => provider !== undefined || purpose !== undefined,
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
