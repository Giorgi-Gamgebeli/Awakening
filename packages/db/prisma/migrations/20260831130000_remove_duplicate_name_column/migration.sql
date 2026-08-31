-- `displayName` is now Better Auth's mapped storage column for its built-in
-- `name` field, so the separate physical `name` column is redundant.
ALTER TABLE "User" DROP COLUMN "name";
