-- CreateEnum
CREATE TYPE "AgentMessageRole" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKeyId" INTEGER,
    "title" VARCHAR(120) NOT NULL,
    "model" VARCHAR(120),
    "provider" "UserApiKeysProvider",
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" "AgentMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentSession_id_key" ON "AgentSession"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMessage_id_key" ON "AgentMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMessage_sessionId_sequence_key" ON "AgentMessage"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "AgentSession_userId_isPinned_lastMessageAt_idx" ON "AgentSession"("userId", "isPinned", "lastMessageAt");

-- CreateIndex
CREATE INDEX "AgentMessage_sessionId_sequence_idx" ON "AgentMessage"("sessionId", "sequence");

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
