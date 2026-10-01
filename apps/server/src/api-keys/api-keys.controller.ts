import { Controller, UseGuards } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { apiKeysContract } from '@repo/zod';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import { ApiKeysService } from './api-keys.service';

@UseGuards(AuthGuard)
@Controller()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Implement(apiKeysContract.apiKeys.create)
  create(@Session() session: UserSession) {
    return implement(apiKeysContract.apiKeys.create).handler(({ input }) =>
      this.apiKeysService.create(input, session.user.id),
    );
  }

  @Implement(apiKeysContract.apiKeys.findMany)
  findMany(@Session() session: UserSession) {
    return implement(apiKeysContract.apiKeys.findMany).handler(() =>
      this.apiKeysService.findMany(session.user.id),
    );
  }

  @Implement(apiKeysContract.apiKeys.patch)
  patch(@Session() session: UserSession) {
    return implement(apiKeysContract.apiKeys.patch).handler(({ input }) =>
      this.apiKeysService.patch(input, session.user.id),
    );
  }

  @Implement(apiKeysContract.apiKeys.delete)
  delete(@Session() session: UserSession) {
    return implement(apiKeysContract.apiKeys.delete).handler(({ input }) =>
      this.apiKeysService.delete(input, session.user.id),
    );
  }
}
