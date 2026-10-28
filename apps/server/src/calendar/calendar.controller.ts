import { Controller, UseGuards } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { calendarEventsContract } from '@repo/zod';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CalendarService } from './calendar.service';

@UseGuards(AuthGuard)
@Controller()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Implement(calendarEventsContract.create)
  create(@Session() session: UserSession) {
    return implement(calendarEventsContract.create).handler(({ input }) =>
      this.calendarService.create(input, session.user.id),
    );
  }

  @Implement(calendarEventsContract.list)
  list(@Session() session: UserSession) {
    return implement(calendarEventsContract.list).handler(() =>
      this.calendarService.list(session.user.id),
    );
  }

  @Implement(calendarEventsContract.patch)
  patch(@Session() session: UserSession) {
    return implement(calendarEventsContract.patch).handler(({ input }) =>
      this.calendarService.patch(input, session.user.id),
    );
  }

  @Implement(calendarEventsContract.delete)
  delete(@Session() session: UserSession) {
    return implement(calendarEventsContract.delete).handler(({ input }) =>
      this.calendarService.delete(input.id, session.user.id),
    );
  }
}
