import { oc } from "@orpc/contract";
import z from "zod";

export const agentChatInputSchema = z.string();

export const agentChatOutputSchema = z.string();

export const agentContract = {
  chat: oc
    .route({
      method: "POST",
      path: "/agent",
    })
    .input(agentChatInputSchema)
    .output(agentChatOutputSchema),
};
