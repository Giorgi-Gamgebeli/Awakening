import { Injectable } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { z } from '@repo/zod';
import {
  toAgentChatResult,
  MODEL_PROBE_TIMEOUT_MS,
  type AgentModel,
  type AgentProvider,
} from './agent-provider';

const anthropicModelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_name: z.string().optional(),
    }),
  ),
});

@Injectable()
export class AnthropicProvider implements AgentProvider {
  readonly name = 'ANTHROPIC' as const;

  async listModels(apiKey: string): Promise<AgentModel[]> {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Anthropic model discovery failed with status ${response.status}.`,
      );
    }

    const { data } = anthropicModelsResponseSchema.parse(await response.json());

    return data.map((model) => ({
      id: model.id,
      label: model.display_name ?? model.id,
    }));
  }

  async chat({
    apiKey,
    text,
    model,
  }: {
    apiKey: string;
    text: string;
    model: string;
  }) {
    const anthropic = createAnthropic({ apiKey });
    const result = await generateText({
      model: anthropic(model),
      prompt: text,
    });

    return toAgentChatResult(result.text, result.finishReason);
  }

  async probeModel(apiKey: string, model: string): Promise<void> {
    const anthropic = createAnthropic({ apiKey });
    await generateText({
      model: anthropic(model),
      prompt: 'Reply with exactly OK.',
      maxOutputTokens: 2,
      maxRetries: 0,
      timeout: MODEL_PROBE_TIMEOUT_MS,
    });
  }
}
