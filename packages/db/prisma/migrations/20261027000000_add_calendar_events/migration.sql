-- CreateEnum
CREATE TYPE "CalendarEventImportance" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CalendarEventCategory" AS ENUM ('GENERAL', 'WORKOUT', 'CLIMBING', 'WORK', 'PERSONAL');

-- CreateEnum
CREATE TYPE "CalendarEventRecurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'EVERY_2_WEEKS', 'EVERY_3_WEEKS', 'WEEKDAYS');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "importance" "CalendarEventImportance" NOT NULL DEFAULT 'NORMAL',
    "category" "CalendarEventCategory" NOT NULL DEFAULT 'GENERAL',
    "notes" TEXT,
    "recurrence" "CalendarEventRecurrence" NOT NULL DEFAULT 'NONE',
    "excludedStarts" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_id_key" ON "CalendarEvent"("id");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startAt_idx" ON "CalendarEvent"("userId", "startAt");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
