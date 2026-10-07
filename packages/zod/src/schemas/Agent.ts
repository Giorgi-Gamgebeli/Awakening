import { oc } from "@orpc/contract";
import z from "zod";

export const agentModelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const agentModelsInputSchema = z.object({
  apiKeyId: z.coerce.number().int().positive(),
});

export const agentModelsOutputSchema = z.array(agentModelSchema);

export const agentChatInputSchema = z.object({
  text: z.string().trim().min(1),
  apiKeyId: z.coerce.number().int().positive(),
  model: z.string().trim().min(1),
});

export const agentChatOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    text: z.string(),
  }),
  z.object({
    status: z.literal("blocked"),
    reason: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal("incomplete"),
    reason: z.string(),
    message: z.string(),
  }),
]);

export const agentContract = {
  models: oc
    .route({
      method: "GET",
      path: "/agent/{apiKeyId}/models",
    })
    .input(agentModelsInputSchema)
    .output(agentModelsOutputSchema),
  chat: oc
    .route({
      method: "POST",
      path: "/agent",
    })
    .input(agentChatInputSchema)
    .output(agentChatOutputSchema),
};
