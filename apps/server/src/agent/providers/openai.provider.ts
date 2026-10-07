import { Injectable } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from '@repo/zod';
import {
  toAgentChatResult,
  MODEL_PROBE_TIMEOUT_MS,
  type AgentModel,
  type AgentProvider,
} from './agent-provider';

const openAiModelsResponseSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});

function isTextGenerationModel(id: string) {
  return (
    /^(gpt-|chatgpt-|o[1-4](?:-|$))/.test(id) &&
    !/(?:audio|image|realtime|transcribe|tts|embedding|moderation|search|whisper)/.test(
      id,
    )
  );
}

@Injectable()
export class OpenAiProvider implements AgentProvider {
  readonly name = 'OPENAI' as const;

  async listModels(apiKey: string): Promise<AgentModel[]> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI model discovery failed with status ${response.status}.`,
      );
    }

    const { data } = openAiModelsResponseSchema.parse(await response.json());

    return data
      .map(({ id }) => id)
      .filter(isTextGenerationModel)
      .map((id) => ({ id, label: id }));
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
    const openai = createOpenAI({ apiKey });
    const result = await generateText({
      model: openai(model),
      prompt: text,
    });

    return toAgentChatResult(result.text, result.finishReason);
  }

  async probeModel(apiKey: string, model: string): Promise<void> {
    const openai = createOpenAI({ apiKey });
    await generateText({
      model: openai(model),
      prompt: 'Reply with exactly OK.',
      maxOutputTokens: 2,
      maxRetries: 0,
      timeout: MODEL_PROBE_TIMEOUT_MS,
    });
  }
}
