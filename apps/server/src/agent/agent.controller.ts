import { Controller, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Implement } from '@orpc/nest';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { agentContract } from '@repo/zod';
import { implement } from '@orpc/server';

@UseGuards(AuthGuard)
@Controller()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Implement(agentContract.chat)
  chat(@Session() session: UserSession) {
    return implement(agentContract.chat).handler(({ input }) =>
      this.agentService.chat(input, session.user.id),
    );
  }

  @Implement(agentContract.models)
  models(@Session() session: UserSession) {
    return implement(agentContract.models).handler(({ input }) =>
      this.agentService.models(input, session.user.id),
    );
  }
}
