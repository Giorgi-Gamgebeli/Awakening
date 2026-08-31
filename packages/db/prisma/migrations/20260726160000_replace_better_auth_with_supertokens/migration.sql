/* Legacy schema cleanup retained for migration history. */

ALTER TABLE "User"
DROP COLUMN "email_verified",
DROP COLUMN "emailVerified",
DROP COLUMN "password";

DROP TABLE "Account";
DROP TABLE "Session";
DROP TABLE "VerificationToken";
DROP TABLE "ResetPasswordToken";
