/*
  Warnings:

  - You are about to alter the column `content` on the `DirectMessage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(4000)`.

*/
-- AlterTable
ALTER TABLE "DirectMessage" ALTER COLUMN "content" SET DATA TYPE VARCHAR(4000);

-- AlterTable
ALTER TABLE "UserApiKeys" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selectedModel" TEXT;

-- DropEnum
DROP TYPE "ChannelType";
