/*
  Warnings:

  - You are about to drop the `UserAPIKeys` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAPIKeys" DROP CONSTRAINT "UserAPIKeys_userId_fkey";

-- DropTable
DROP TABLE "UserAPIKeys";

-- CreateTable
CREATE TABLE "UserApiKeys" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserApiKeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserApiKeys_id_key" ON "UserApiKeys"("id");

-- CreateIndex
CREATE INDEX "UserApiKeys_userId_idx" ON "UserApiKeys"("userId");

-- AddForeignKey
ALTER TABLE "UserApiKeys" ADD CONSTRAINT "UserApiKeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
