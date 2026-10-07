import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import type { AgentProvider, AgentProviderName } from './agent-provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenAiProvider } from './openai.provider';

@Injectable()
export class AgentProviderRegistry {
  private readonly providers: ReadonlyMap<AgentProviderName, AgentProvider>;

  constructor(
    gemini: GeminiProvider,
    openai: OpenAiProvider,
    anthropic: AnthropicProvider,
  ) {
    this.providers = new Map<AgentProviderName, AgentProvider>([
      [gemini.name, gemini],
      [openai.name, openai],
      [anthropic.name, anthropic],
    ]);
  }

  get(name: AgentProviderName): AgentProvider {
    const provider = this.providers.get(name);

    if (!provider) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'This AI provider is not supported.',
      });
    }

    return provider;
  }
}
