import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, type ToolSet } from 'ai';
import { z } from '@repo/zod';
import {
  logAgentStep,
  stopCalendarAgentLoop,
  toAgentChatResult,
  toToolResultText,
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

@Injectable()
export class GeminiProvider implements AgentProvider {
  readonly name = 'GEMINI' as const;
  private readonly logger = new Logger(GeminiProvider.name);

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
      .map((model) => {
        const id = model.name.replace(/^models\//, '');
        return {
          id,
          label: model.displayName ?? id,
        };
      });
  }

  async chat({
    apiKey,
    text,
    model,
    reasoningEffort,
    system,
    tools,
  }: {
    apiKey: string;
    text: string;
    model: string;
    reasoningEffort: 'low' | 'medium' | 'high' | null;
    system?: string;
    tools?: ToolSet;
  }) {
    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateText({
      model: google(model),
      prompt: text,
      maxRetries: tools ? 0 : 2,
      onStepFinish: (step) => logAgentStep(this.logger, this.name, step),
      ...(system ? { system } : {}),
      ...(tools ? { tools, stopWhen: stopCalendarAgentLoop } : {}),
      ...(reasoningEffort
        ? {
            providerOptions: {
              google: { thinkingConfig: { thinkingLevel: reasoningEffort } },
            },
          }
        : {}),
    });

    return toAgentChatResult(
      result.text,
      result.finishReason,
      toToolResultText(result.steps.at(-1)?.toolResults ?? []),
    );
  }
}
