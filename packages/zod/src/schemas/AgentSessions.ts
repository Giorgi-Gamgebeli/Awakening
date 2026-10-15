import { oc } from "@orpc/contract";
import z from "zod";

export const agentSessionStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export const agentMessageRoleSchema = z.enum(["USER", "ASSISTANT", "SYSTEM"]);

export const agentSessionSchema = z.object({
  id: z.string().uuid(),
  apiKeyId: z.number().int().positive().nullable(),
  title: z.string(),
  model: z.string().nullable(),
  provider: z.string().nullable(),
  status: agentSessionStatusSchema,
  lastMessageAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  messageCount: z.number().int().nonnegative(),
});

export const agentMessageSchema = z.object({
  id: z.string().uuid(),
  seq: z.number().int().nonnegative(),
  role: agentMessageRoleSchema,
  content: z.string(),
  model: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const agentSessionsCreateInputSchema = z.object({
  apiKeyId: z.coerce.number().int().positive().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(120).optional(),
});

export const agentSessionsListInputSchema = z.object({
  status: agentSessionStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().uuid().optional(),
});

export const agentSessionsListOutputSchema = z.object({
  items: z.array(agentSessionSchema),
  nextCursor: z.string().uuid().nullable(),
});

export const agentSessionDetailInputSchema = z.object({
  id: z.string().uuid(),
});

export const agentSessionMessagesInputSchema = z.object({
  id: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.coerce.number().int().min(0).optional(),
});

export const agentSessionMessagesOutputSchema = z.object({
  session: agentSessionSchema,
  items: z.array(agentMessageSchema),
  nextCursor: z.number().int().nonnegative().nullable(),
});

export const agentSessionsRenameInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
});

export const agentSessionsDeleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const agentSessionsArchiveInputSchema = z.object({
  id: z.string().uuid(),
  status: agentSessionStatusSchema,
});

export const agentSessionsContract = {
  create: oc
    .route({ method: "POST", path: "/agent/sessions" })
    .input(agentSessionsCreateInputSchema)
    .output(agentSessionSchema),
  list: oc
    .route({ method: "GET", path: "/agent/sessions" })
    .input(agentSessionsListInputSchema)
    .output(agentSessionsListOutputSchema),
  messages: oc
    .route({ method: "GET", path: "/agent/sessions/{id}/messages" })
    .input(agentSessionMessagesInputSchema)
    .output(agentSessionMessagesOutputSchema),
  rename: oc
    .route({ method: "PATCH", path: "/agent/sessions/{id}" })
    .input(agentSessionsRenameInputSchema)
    .output(agentSessionSchema),
  setStatus: oc
    .route({ method: "PATCH", path: "/agent/sessions/{id}/status" })
    .input(agentSessionsArchiveInputSchema)
    .output(agentSessionSchema),
  delete: oc
    .route({ method: "DELETE", path: "/agent/sessions/{id}" })
    .input(agentSessionsDeleteInputSchema)
    .output(agentSessionsDeleteInputSchema),
};
