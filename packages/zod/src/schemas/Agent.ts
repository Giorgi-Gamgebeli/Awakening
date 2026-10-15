import { oc } from "@orpc/contract";
import z from "zod";
import { agentSessionsContract } from "./AgentSessions.js";

export const agentModelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const agentModelsInputSchema = z.object({
  apiKeyId: z.coerce.number().int().positive(),
});

export const agentModelsOutputSchema = z.array(agentModelSchema);

export const agentChatInputSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  apiKeyId: z.coerce.number().int().positive(),
  model: z.string().trim().min(1),
  sessionId: z.string().uuid().optional(),
});

const agentChatContextSchema = z.object({
  sessionId: z.string().uuid(),
  userMessageId: z.string().uuid(),
  assistantMessageId: z.string().uuid().nullable(),
});

export const agentChatOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    text: z.string(),
    sessionId: agentChatContextSchema.shape.sessionId,
    userMessageId: agentChatContextSchema.shape.userMessageId,
    assistantMessageId: agentChatContextSchema.shape.assistantMessageId,
  }),
  z.object({
    status: z.literal("blocked"),
    reason: z.string(),
    message: z.string(),
    sessionId: agentChatContextSchema.shape.sessionId,
    userMessageId: agentChatContextSchema.shape.userMessageId,
    assistantMessageId: agentChatContextSchema.shape.assistantMessageId,
  }),
  z.object({
    status: z.literal("incomplete"),
    reason: z.string(),
    message: z.string(),
    sessionId: agentChatContextSchema.shape.sessionId,
    userMessageId: agentChatContextSchema.shape.userMessageId,
    assistantMessageId: agentChatContextSchema.shape.assistantMessageId,
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
  sessions: agentSessionsContract,
};
