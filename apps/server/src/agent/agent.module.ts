import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentSessionsService } from './agent-sessions.service';
import { AgentController } from './agent.controller';
import { CryptoModule } from '../crypto/crypto.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AgentProviderRegistry } from './providers/agent-provider-registry.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [CryptoModule, CalendarModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentSessionsService,
    AgentProviderRegistry,
    GeminiProvider,
    OpenAiProvider,
    AnthropicProvider,
  ],
  exports: [AgentProviderRegistry, AgentService, AgentSessionsService],
})
export class AgentModule {}
