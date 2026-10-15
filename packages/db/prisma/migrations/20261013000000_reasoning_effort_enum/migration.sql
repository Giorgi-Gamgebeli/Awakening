CREATE TYPE "UserApiKeysReasoningEffort" AS ENUM ('default', 'low', 'medium', 'high');

ALTER TABLE "UserApiKeys"
  ALTER COLUMN "reasoningEffort" DROP DEFAULT,
  ALTER COLUMN "reasoningEffort" TYPE "UserApiKeysReasoningEffort"
  USING CASE lower("reasoningEffort")
    WHEN 'low' THEN 'low'::"UserApiKeysReasoningEffort"
    WHEN 'medium' THEN 'medium'::"UserApiKeysReasoningEffort"
    WHEN 'high' THEN 'high'::"UserApiKeysReasoningEffort"
    ELSE 'default'::"UserApiKeysReasoningEffort"
  END,
  ALTER COLUMN "reasoningEffort" SET DEFAULT 'default',
  ALTER COLUMN "reasoningEffort" SET NOT NULL;
