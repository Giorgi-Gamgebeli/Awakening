import { Controller, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentSessionsService } from './agent-sessions.service';
import { Implement } from '@orpc/nest';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { agentContract } from '@repo/zod';
import { implement } from '@orpc/server';

@UseGuards(AuthGuard)
@Controller()
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly sessionsService: AgentSessionsService,
  ) {}

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

  @Implement(agentContract.sessions.create)
  createSession(@Session() session: UserSession) {
    return implement(agentContract.sessions.create).handler(({ input }) =>
      this.sessionsService.create(input, session.user.id),
    );
  }

  @Implement(agentContract.sessions.list)
  listSessions(@Session() session: UserSession) {
    return implement(agentContract.sessions.list).handler(({ input }) =>
      this.sessionsService.list(input, session.user.id),
    );
  }

  @Implement(agentContract.sessions.messages)
  sessionMessages(@Session() session: UserSession) {
    return implement(agentContract.sessions.messages).handler(({ input }) =>
      this.sessionsService.getMessages(input, session.user.id),
    );
  }

  @Implement(agentContract.sessions.rename)
  renameSession(@Session() session: UserSession) {
    return implement(agentContract.sessions.rename).handler(({ input }) =>
      this.sessionsService.rename(input, session.user.id),
    );
  }

  @Implement(agentContract.sessions.setStatus)
  setSessionStatus(@Session() session: UserSession) {
    return implement(agentContract.sessions.setStatus).handler(({ input }) =>
      this.sessionsService.setStatus(input, session.user.id),
    );
  }

  @Implement(agentContract.sessions.delete)
  deleteSession(@Session() session: UserSession) {
    return implement(agentContract.sessions.delete).handler(({ input }) =>
      this.sessionsService.delete(input, session.user.id),
    );
  }
}
