import {
  agentChatOutputSchema,
  agentModelSchema,
  ApiKeysProviderSchema,
  z,
} from '@repo/zod';

export type AgentChatResult = z.infer<typeof agentChatOutputSchema>;
export type AgentModel = z.infer<typeof agentModelSchema>;
export type AgentProviderName = z.infer<typeof ApiKeysProviderSchema>;

export const MODEL_PROBE_TIMEOUT_MS = 8_000;

export type AgentProvider = {
  readonly name: AgentProviderName;
  listModels(apiKey: string): Promise<AgentModel[]>;
  /**
   * Confirms this exact credential can make a text-generation request with a
   * model. Listing a model is not sufficient: providers may list models that
   * the credential is not entitled to use.
   */
  probeModel(apiKey: string, model: string): Promise<void>;
  chat(input: {
    apiKey: string;
    text: string;
    model: string;
  }): Promise<AgentChatResult>;
};

export function toAgentChatResult(
  text: string,
  finishReason: string | undefined,
): AgentChatResult {
  if (text.trim()) {
    return { status: 'success', text };
  }

  if (finishReason === 'content-filter') {
    return {
      status: 'blocked',
      reason: finishReason,
      message: 'The AI provider blocked the response for safety reasons.',
    };
  }

  return {
    status: 'incomplete',
    reason: finishReason ?? 'UNKNOWN',
    message: 'The AI provider finished without returning text.',
  };
}
