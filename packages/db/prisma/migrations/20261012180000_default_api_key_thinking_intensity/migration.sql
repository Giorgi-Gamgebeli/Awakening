UPDATE "UserApiKeys" SET "thinkingIntensity" = 'MEDIUM' WHERE "thinkingIntensity" IS NULL;
ALTER TABLE "UserApiKeys" ALTER COLUMN "thinkingIntensity" SET DEFAULT 'MEDIUM';
