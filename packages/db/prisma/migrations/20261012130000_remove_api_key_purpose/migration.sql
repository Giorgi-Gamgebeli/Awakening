-- Remove the old agent/translation classification. API keys are now general
-- provider keys, with one active key per user.
DROP INDEX "UserApiKeys_userId_purpose_idx";

ALTER TABLE "UserApiKeys" DROP COLUMN "purpose";

DROP TYPE "UserApiKeysPurpose";

CREATE INDEX "UserApiKeys_userId_idx" ON "UserApiKeys"("userId");
