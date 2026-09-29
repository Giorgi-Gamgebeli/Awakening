-- CreateTable
CREATE TABLE "UserAPIKeys" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserAPIKeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAPIKeys_id_key" ON "UserAPIKeys"("id");

-- CreateIndex
CREATE INDEX "UserAPIKeys_userId_idx" ON "UserAPIKeys"("userId");

-- AddForeignKey
ALTER TABLE "UserAPIKeys" ADD CONSTRAINT "UserAPIKeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
