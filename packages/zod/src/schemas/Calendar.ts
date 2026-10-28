import { oc } from "@orpc/contract";
import z from "zod";

export const calendarImportanceSchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);
export const calendarCategorySchema = z.enum([
  "general",
  "workout",
  "climbing",
  "work",
  "personal",
]);
export const calendarRecurrenceSchema = z.enum([
  "none",
  "daily",
  "weekly",
  "every2weeks",
  "every3weeks",
  "weekdays",
]);

const calendarEventFields = z.object({
  title: z.string().trim().min(1).max(200),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  allDay: z.boolean().default(false),
  importance: calendarImportanceSchema.default("normal"),
  category: calendarCategorySchema.default("general"),
  notes: z.string().max(8000).nullable().optional(),
  recurrence: calendarRecurrenceSchema.default("none"),
  excludedStarts: z.array(z.coerce.date()).default([]),
});

export const calendarEventSchema = calendarEventFields.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const calendarEventsCreateInputSchema = calendarEventFields.refine(
  ({ startAt, endAt }) => endAt > startAt,
  { message: "An event must end after it starts." },
);

export const calendarEventsListInputSchema = z.object({});

export const calendarEventsPatchInputSchema = calendarEventFields
  .partial()
  .extend({ id: z.string().uuid() })
  .refine(
    ({ id: _id, ...changes }) =>
      Object.values(changes).some((value) => value !== undefined),
    { message: "Provide at least one field to update." },
  );

export const calendarEventsDeleteInputSchema = z.object({
  id: z.string().uuid(),
});

export const calendarEventsContract = {
  create: oc
    .route({ method: "POST", path: "/calendar/events" })
    .input(calendarEventsCreateInputSchema)
    .output(calendarEventSchema),
  list: oc
    .route({ method: "GET", path: "/calendar/events" })
    .input(calendarEventsListInputSchema)
    .output(z.array(calendarEventSchema)),
  patch: oc
    .route({ method: "PATCH", path: "/calendar/events/{id}" })
    .input(calendarEventsPatchInputSchema)
    .output(calendarEventSchema),
  delete: oc
    .route({ method: "DELETE", path: "/calendar/events/{id}" })
    .input(calendarEventsDeleteInputSchema)
    .output(calendarEventsDeleteInputSchema),
};
