import { Logger } from '@nestjs/common';
import { tool, type ToolSet } from 'ai';
import {
  calendarCategorySchema,
  calendarImportanceSchema,
  calendarRecurrenceSchema,
  z,
} from '@repo/zod';
import type { CalendarService } from '../calendar/calendar.service';

const logger = new Logger('CalendarTools');
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );

  return asUtc - date.getTime();
}

function localDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error('Expected a date as YYYY-MM-DD and a time as HH:mm.');
  }

  const wallClock = Date.UTC(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );

  const firstOffset = getTimeZoneOffsetMs(new Date(wallClock), timeZone);
  const instant = wallClock - firstOffset;
  const settledOffset = getTimeZoneOffsetMs(new Date(instant), timeZone);

  return new Date(wallClock - settledOffset);
}

function addDays(date: string, days: number): string {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new Error('Expected a date as YYYY-MM-DD.');

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days),
  )
    .toISOString()
    .slice(0, 10);
}

function formatLocalDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getLocalDateTimeParts(
  date: Date,
  timeZone: string,
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
}

function formatEventLine(
  event: { title: string; startAt: Date; endAt: Date; allDay: boolean },
  timeZone: string,
): string {
  const date = formatLocalDate(event.startAt, timeZone);
  if (event.allDay) return `- ${event.title} (all day) on ${date}`;

  return `- ${event.title} on ${date} from ${formatLocalTime(
    event.startAt,
    timeZone,
  )} to ${formatLocalTime(event.endAt, timeZone)}`;
}

function eventSummary(event: {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  importance: string;
  category: string;
  notes?: string | null;
  recurrence: string;
}) {
  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    allDay: event.allDay,
    importance: event.importance,
    category: event.category,
    notes: event.notes,
    recurrence: event.recurrence,
  };
}

export function createCalendarTools(
  calendar: CalendarService,
  userId: string,
  timeZone: string,
): ToolSet {
  return {
    create_calendar_event: tool({
      description:
        'Create a new event in the user\'s calendar. Use this whenever the user asks to add, schedule, or change something. Dates and times are interpreted in the user\'s local time zone.',
      inputSchema: z.object({
        title: z
          .string()
          .trim()
          .min(1)
          .max(200)
          .describe(
            'Short event title. If the user does not provide one, use a sensible label such as "Event".',
          ),
        date: z
          .string()
          .regex(DATE_PATTERN)
          .describe('Local date of the event in YYYY-MM-DD format.'),
        startTime: z
          .string()
          .regex(TIME_PATTERN)
          .describe('Local start time in 24-hour HH:mm format.'),
        endTime: z
          .string()
          .regex(TIME_PATTERN)
          .nullish()
          .describe(
            'Local end time in 24-hour HH:mm format. Defaults to one hour after the start time.',
          ),
        allDay: z.boolean().nullish(),
        importance: calendarImportanceSchema.nullish(),
        category: calendarCategorySchema.nullish(),
        notes: z.string().max(8000).nullish(),
        recurrence: calendarRecurrenceSchema.nullish(),
      }),
      execute: async (input) => {
        try {
          const startAt = localDateTimeToUtc(
            input.date,
            input.allDay ? '00:00' : input.startTime,
            timeZone,
          );

          const endAt = input.allDay
            ? localDateTimeToUtc(addDays(input.date, 1), '00:00', timeZone)
            : input.endTime
              ? localDateTimeToUtc(input.date, input.endTime, timeZone)
              : new Date(startAt.getTime() + 60 * 60 * 1000);

          if (endAt <= startAt) {
            return {
              timeZone,
              created: false,
              message: 'I could not create the event because it must end after it starts.',
            };
          }

          const event = await calendar.create(
            {
              title: input.title,
              startAt,
              endAt,
              allDay: input.allDay ?? false,
              importance: input.importance ?? 'normal',
              category: input.category ?? 'general',
              notes: input.notes ?? null,
              recurrence: input.recurrence ?? 'none',
              excludedStarts: [],
            },
            userId,
          );

          return {
            timeZone,
            created: true,
            event: eventSummary(event),
            message: event.allDay
              ? `Created "${event.title}" all day on ${formatLocalDate(
                  event.startAt,
                  timeZone,
                )}.`
              : `Created "${event.title}" on ${formatLocalDate(
                  event.startAt,
                  timeZone,
                )} from ${formatLocalTime(
                  event.startAt,
                  timeZone,
                )} to ${formatLocalTime(event.endAt, timeZone)}.`,
          };
        } catch (error) {
          logger.error(
            `create_calendar_event failed: userId=${userId}, timeZone=${timeZone}`,
            error instanceof Error ? error.stack : undefined,
          );
          return {
            timeZone,
            created: false,
            message:
              'I could not create the calendar event because of a server error. Please try again.',
          };
        }
      },
    }),

    update_calendar_event: tool({
      description:
        'Update or reschedule an existing calendar event. Use list_calendar_events first to find the event id. Provide only the fields that should change. Dates and times are interpreted in the user\'s local time zone.',
      inputSchema: z.object({
        id: z.string().uuid().describe('The id of the event to update.'),
        title: z
          .string()
          .trim()
          .min(1)
          .max(200)
          .nullish()
          .describe('New short event title.'),
        date: z
          .string()
          .regex(DATE_PATTERN)
          .nullish()
          .describe('New local date of the event in YYYY-MM-DD format.'),
        startTime: z
          .string()
          .regex(TIME_PATTERN)
          .nullish()
          .describe('New local start time in 24-hour HH:mm format.'),
        endTime: z
          .string()
          .regex(TIME_PATTERN)
          .nullish()
          .describe('New local end time in 24-hour HH:mm format.'),
        allDay: z.boolean().nullish(),
        importance: calendarImportanceSchema.nullish(),
        category: calendarCategorySchema.nullish(),
        notes: z.string().max(8000).nullish(),
        recurrence: calendarRecurrenceSchema.nullish(),
      }),
      execute: async (input) => {
        try {
          const events = await calendar.list(userId);
          const existing = events.find((event) => event.id === input.id);
          if (!existing) {
            return {
              timeZone,
              updated: false,
              message:
                'I could not find that calendar event. It may have been deleted.',
            };
          }

          const hasTimingChange =
            input.date != null ||
            input.startTime != null ||
            input.endTime != null ||
            input.allDay != null;

          let nextStartAt: Date | undefined;
          let nextEndAt: Date | undefined;

          if (hasTimingChange) {
            const existingStart = getLocalDateTimeParts(
              existing.startAt,
              timeZone,
            );
            const existingEnd = getLocalDateTimeParts(existing.endAt, timeZone);
            const targetAllDay = input.allDay ?? existing.allDay;

            if (targetAllDay) {
              const targetDate = input.date ?? existingStart.date;
              nextStartAt = localDateTimeToUtc(targetDate, '00:00', timeZone);
              nextEndAt = localDateTimeToUtc(
                addDays(targetDate, 1),
                '00:00',
                timeZone,
              );
            } else {
              if (existing.allDay && input.startTime == null) {
                return {
                  timeZone,
                  updated: false,
                  message: 'What time should the event start?',
                };
              }

              const targetDate = input.date ?? existingStart.date;
              const targetStartTime = input.startTime ?? existingStart.time;
              nextStartAt = localDateTimeToUtc(
                targetDate,
                targetStartTime,
                timeZone,
              );

              if (input.endTime != null) {
                nextEndAt = localDateTimeToUtc(
                  targetDate,
                  input.endTime,
                  timeZone,
                );
              } else if (input.startTime != null) {
                const duration = existing.allDay
                  ? 60 * 60 * 1000
                  : existing.endAt.getTime() - existing.startAt.getTime();
                nextEndAt = new Date(nextStartAt.getTime() + duration);
              } else {
                nextEndAt = localDateTimeToUtc(
                  targetDate,
                  existingEnd.time,
                  timeZone,
                );
              }

              if (nextEndAt <= nextStartAt) {
                return {
                  timeZone,
                  updated: false,
                  message: 'The event must end after it starts.',
                };
              }
            }
          }

          const patch = {
            id: existing.id,
            ...(input.title != null ? { title: input.title } : {}),
            ...(nextStartAt ? { startAt: nextStartAt } : {}),
            ...(nextEndAt ? { endAt: nextEndAt } : {}),
            ...(input.allDay != null ? { allDay: input.allDay } : {}),
            ...(input.importance != null
              ? { importance: input.importance }
              : {}),
            ...(input.category != null ? { category: input.category } : {}),
            ...(typeof input.notes === 'string' ? { notes: input.notes } : {}),
            ...(input.recurrence != null
              ? { recurrence: input.recurrence }
              : {}),
          };

          if (Object.keys(patch).length === 1) {
            return {
              timeZone,
              updated: false,
              message: 'Tell me what you would like to change.',
            };
          }

          const event = await calendar.patch(patch, userId);
          const when = event.allDay
            ? `all day on ${formatLocalDate(event.startAt, timeZone)}`
            : `${formatLocalDate(
                event.startAt,
                timeZone,
              )} from ${formatLocalTime(
                event.startAt,
                timeZone,
              )} to ${formatLocalTime(event.endAt, timeZone)}`;

          return {
            timeZone,
            updated: true,
            event: eventSummary(event),
            message: hasTimingChange
              ? `Moved "${event.title}" to ${when}.`
              : `Updated "${event.title}".`,
          };
        } catch (error) {
          logger.error(
            `update_calendar_event failed: userId=${userId}, timeZone=${timeZone}`,
            error instanceof Error ? error.stack : undefined,
          );
          return {
            timeZone,
            updated: false,
            message:
              'I could not update the calendar event because of a server error. Please try again.',
          };
        }
      },
    }),

    list_calendar_events: tool({
      description:
        'List the user\'s calendar events. Use this to answer questions about the schedule or to find an event id before changing it. Dates are filtered in the user\'s local time zone.',
      inputSchema: z.object({
        from: z
          .string()
          .regex(DATE_PATTERN)
          .nullish()
          .describe('Optional inclusive local start date in YYYY-MM-DD format.'),
        to: z
          .string()
          .regex(DATE_PATTERN)
          .nullish()
          .describe('Optional inclusive local end date in YYYY-MM-DD format.'),
      }),
      execute: async ({ from, to }) => {
        try {
          const fromInstant = from
            ? localDateTimeToUtc(from, '00:00', timeZone)
            : null;
          const toInstant = to
            ? localDateTimeToUtc(addDays(to, 1), '00:00', timeZone)
            : null;

          const events = await calendar.list(userId);
          const filtered = events.filter((event) => {
            if (event.recurrence !== 'none') return true;
            if (fromInstant && event.endAt < fromInstant) return false;
            if (toInstant && event.startAt >= toInstant) return false;
            return true;
          });

          const shown = filtered.slice(0, 25);
          const message =
            filtered.length === 0
              ? 'No calendar events found for that range.'
              : [
                  `Found ${filtered.length} calendar event${
                    filtered.length === 1 ? '' : 's'
                  }:`,
                  ...shown.map((event) => formatEventLine(event, timeZone)),
                  ...(filtered.length > shown.length
                    ? [`...and ${filtered.length - shown.length} more.`]
                    : []),
                ].join('\n');

          return {
            timeZone,
            events: filtered.map(eventSummary),
            message,
          };
        } catch (error) {
          logger.error(
            `list_calendar_events failed: userId=${userId}, timeZone=${timeZone}`,
            error instanceof Error ? error.stack : undefined,
          );
          return {
            timeZone,
            events: [],
            message:
              'I could not load the calendar events because of a server error. Please try again.',
          };
        }
      },
    }),
  };
}
