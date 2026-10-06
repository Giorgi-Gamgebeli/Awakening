-- AlterTable
ALTER TABLE "UserApiKeys"
ADD COLUMN "availableModels" JSONB,
ADD COLUMN "modelsUpdatedAt" TIMESTAMP(3);
