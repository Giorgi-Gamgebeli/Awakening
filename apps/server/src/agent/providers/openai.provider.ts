import { Injectable, Logger } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
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

const openAiModelsResponseSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});

@Injectable()
export class OpenAiProvider implements AgentProvider {
  readonly name = 'OPENAI' as const;
  private readonly logger = new Logger(OpenAiProvider.name);

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
      .map((id) => ({ id, label: id }));
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
    const openai = createOpenAI({ apiKey });
    const result = await generateText({
      model: openai(model),
      prompt: text,
      maxRetries: tools ? 0 : 2,
      onStepFinish: (step) => logAgentStep(this.logger, this.name, step),
      ...(system ? { system } : {}),
      ...(tools ? { tools, stopWhen: stopCalendarAgentLoop } : {}),
      ...(reasoningEffort
        ? { providerOptions: { openai: { reasoningEffort } } }
        : {}),
    });

    return toAgentChatResult(
      result.text,
      result.finishReason,
      toToolResultText(result.steps.at(-1)?.toolResults ?? []),
    );
  }
}
