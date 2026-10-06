import { Injectable } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { z } from '@repo/zod';
import {
  toAgentChatResult,
  MODEL_PROBE_TIMEOUT_MS,
  type AgentModel,
  type AgentProvider,
} from './agent-provider';

const geminiModelsResponseSchema = z.object({
  models: z
    .array(
      z.object({
        name: z.string(),
        displayName: z.string().optional(),
        supportedGenerationMethods: z.array(z.string()).optional(),
      }),
    )
    .default([]),
});

function isTextChatModel(id: string) {
  return (
    /^(gemini|gemma)-/.test(id) &&
    !/(?:tts|transcribe|image|lyria|robotics|computer-use|antigravity|deep-research|omni)/.test(
      id,
    )
  );
}

@Injectable()
export class GeminiProvider implements AgentProvider {
  readonly name = 'GEMINI' as const;

  async listModels(apiKey: string): Promise<AgentModel[]> {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
      {
        headers: { 'x-goog-api-key': apiKey },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gemini model discovery failed with status ${response.status}.`,
      );
    }

    const { models } = geminiModelsResponseSchema.parse(await response.json());

    return models
      .filter((model) =>
        model.supportedGenerationMethods?.includes('generateContent'),
      )
      .map((model) => {
        const id = model.name.replace(/^models\//, '');
        return {
          id,
          label: model.displayName ?? id,
        };
      })
      .filter((model) => isTextChatModel(model.id));
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
    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateText({
      model: google(model),
      prompt: text,
    });

    return toAgentChatResult(result.text, result.finishReason);
  }

  async probeModel(apiKey: string, model: string): Promise<void> {
    const google = createGoogleGenerativeAI({ apiKey });
    await generateText({
      model: google(model),
      prompt: 'Reply with exactly OK.',
      maxOutputTokens: 2,
      maxRetries: 0,
      timeout: MODEL_PROBE_TIMEOUT_MS,
    });
  }
}
