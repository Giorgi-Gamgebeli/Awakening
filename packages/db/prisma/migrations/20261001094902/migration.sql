/*
  Warnings:

  - The `purpose` column on the `UserApiKeys` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserApiKeysPurpose" AS ENUM ('AGENT', 'TRANSLATION');

-- AlterTable
ALTER TABLE "UserApiKeys" DROP COLUMN "purpose",
ADD COLUMN     "purpose" "UserApiKeysPurpose" NOT NULL DEFAULT 'AGENT';

-- CreateIndex
CREATE INDEX "UserApiKeys_userId_purpose_idx" ON "UserApiKeys"("userId", "purpose");
