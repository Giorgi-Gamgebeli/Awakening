/*
  Warnings:

  - Changed the type of `provider` on the `UserApiKeys` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserApiKeysProvider" AS ENUM ('GEMINI', 'OPENAI', 'ANTHROPIC');

-- AlterTable
ALTER TABLE "UserApiKeys" DROP COLUMN "provider",
ADD COLUMN     "provider" "UserApiKeysProvider" NOT NULL;
