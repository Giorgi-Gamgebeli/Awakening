import { oc } from "@orpc/contract";
import { agentContract } from "./Agent.js";
import { apiKeysContract } from "./ApiKeys.js";

export const appContract = oc.router({
  apiKeys: apiKeysContract,
  agent: agentContract,
});
