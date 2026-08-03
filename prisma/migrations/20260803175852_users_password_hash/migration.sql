-- Reconcile `users` with the password-based auth the application actually ships.
--
-- The init migration predates the move off Auth0: it creates `auth0Id NOT NULL`
-- and no `passwordHash`, so `prisma migrate deploy` against an empty database
-- produced a schema every login failed on. Split out from the passkey migration
-- so the fix is reviewable on its own rather than buried in a feature change.
--
-- Written idempotently because a long-lived database may already have been
-- reconciled by hand; this must be a no-op there rather than an error.

DROP INDEX IF EXISTS "public"."users_auth0Id_key";
DROP INDEX IF EXISTS "public"."users_auth0Id_idx";

-- Backfilled rows get an empty hash, which Argon2 verification rejects (see
-- PasswordService.verify) — such an account is locked out rather than open.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP DEFAULT;

ALTER TABLE "users" DROP COLUMN IF EXISTS "auth0Id";
