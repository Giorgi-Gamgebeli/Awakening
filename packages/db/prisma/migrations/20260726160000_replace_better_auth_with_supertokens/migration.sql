/*
  SuperTokens Core owns authentication credentials and sessions in its own
  `supertokens_`-prefixed tables. These were Better Auth's obsolete tables.
*/

ALTER TABLE "User"
DROP COLUMN "email_verified",
DROP COLUMN "emailVerified",
DROP COLUMN "password";

DROP TABLE "Account";
DROP TABLE "Session";
DROP TABLE "VerificationToken";
DROP TABLE "ResetPasswordToken";
