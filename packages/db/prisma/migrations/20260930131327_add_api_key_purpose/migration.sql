-- DropIndex
DROP INDEX "UserApiKeys_userId_idx";

-- AlterTable
ALTER TABLE "UserApiKeys" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'work';

-- CreateIndex
CREATE INDEX "UserApiKeys_userId_purpose_idx" ON "UserApiKeys"("userId", "purpose");
