import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { CryptoModule } from '../crypto/crypto.module';
import { AgentProviderRegistry } from './providers/agent-provider-registry.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [CryptoModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentProviderRegistry,
    GeminiProvider,
    OpenAiProvider,
    AnthropicProvider,
  ],
})
export class AgentModule {}
