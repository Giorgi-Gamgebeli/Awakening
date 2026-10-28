import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { db } from '@repo/db';
import {
  calendarEventSchema,
  calendarEventsCreateInputSchema,
  calendarEventsPatchInputSchema,
  z,
} from '@repo/zod';

type CalendarEventShape = z.infer<typeof calendarEventSchema>;

function toCalendarEventShape(row: {
  id: string;
  userId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  importance: string;
  category: string;
  notes: string | null;
  recurrence: string;
  excludedStarts: Date[];
  createdAt: Date;
  updatedAt: Date;
}): CalendarEventShape {
  return {
    ...row,
    importance: row.importance.toLowerCase() as CalendarEventShape['importance'],
    category: row.category.toLowerCase() as CalendarEventShape['category'],
    recurrence: row.recurrence
      .toLowerCase()
      .replace('_weeks', 'weeks')
      .replace('_', '') as CalendarEventShape['recurrence'],
  };
}

function toDatabaseEnum(value: string) {
  return value.replace(/every(\d+)weeks/, 'EVERY_$1_WEEKS').toUpperCase();
}

function assertEventTiming(startAt: Date, endAt: Date) {
  if (endAt <= startAt) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'An event must end after it starts.',
    });
  }
}

@Injectable()
export class CalendarService {
  async create(
    input: z.infer<typeof calendarEventsCreateInputSchema>,
    userId: string,
  ): Promise<CalendarEventShape> {
    const row = await db.calendarEvent.create({
      data: {
        userId,
        title: input.title,
        startAt: input.startAt,
        endAt: input.endAt,
        allDay: input.allDay,
        importance: toDatabaseEnum(input.importance) as never,
        category: toDatabaseEnum(input.category) as never,
        notes: input.notes ?? null,
        recurrence: toDatabaseEnum(input.recurrence) as never,
        excludedStarts: input.excludedStarts,
      },
    });
    return toCalendarEventShape(row);
  }

  async list(userId: string): Promise<CalendarEventShape[]> {
    const rows = await db.calendarEvent.findMany({
      where: { userId },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toCalendarEventShape);
  }

  async patch(
    input: z.infer<typeof calendarEventsPatchInputSchema>,
    userId: string,
  ): Promise<CalendarEventShape> {
    const existing = await db.calendarEvent.findFirst({
      where: { id: input.id, userId },
    });
    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Calendar event not found.' });
    }

    assertEventTiming(
      input.startAt ?? existing.startAt,
      input.endAt ?? existing.endAt,
    );

    const row = await db.calendarEvent.update({
      where: { id: input.id },
      data: {
        title: input.title,
        startAt: input.startAt,
        endAt: input.endAt,
        allDay: input.allDay,
        importance:
          input.importance === undefined
            ? undefined
            : (toDatabaseEnum(input.importance) as never),
        category:
          input.category === undefined
            ? undefined
            : (toDatabaseEnum(input.category) as never),
        notes: input.notes,
        recurrence:
          input.recurrence === undefined
            ? undefined
            : (toDatabaseEnum(input.recurrence) as never),
        excludedStarts: input.excludedStarts,
      },
    });
    return toCalendarEventShape(row);
  }

  async delete(id: string, userId: string) {
    const result = await db.calendarEvent.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      throw new ORPCError('NOT_FOUND', { message: 'Calendar event not found.' });
    }
    return { id };
  }
}
