-- Assert `users.passwordHash` is NOT NULL, matching `passwordHash String` in
-- schema.prisma.
--
-- Why a separate migration rather than a line appended to
-- 20260803175852_users_password_hash, which is where this logically belongs:
-- that migration has already been applied. Prisma selects migrations to run by
-- directory name against `_prisma_migrations`, so an appended statement would
-- never execute on any database that already ran it — precisely the
-- hand-reconciled database it would have been written for — and the changed
-- file would fail the stored checksum, so `prisma migrate dev` would offer a
-- database reset and `migrate deploy` would refuse to proceed. Migration
-- directories are append-only once applied anywhere.
--
-- The backfill is not optional. `ADD COLUMN IF NOT EXISTS` in the earlier
-- migration is a no-op on a database where the column was already added by
-- hand, and such a column may well be nullable AND hold NULLs. Without the
-- UPDATE, `SET NOT NULL` aborts with `column "passwordHash" contains null
-- values`, Prisma records the migration as failed, and every subsequent
-- `migrate deploy` refuses to run until someone clears it by hand with
-- `migrate resolve --rolled-back`. docker-compose chains migrate and the server
-- with `&&`, so that failure also stops the container starting.
--
-- An empty hash is rejected by Argon2 verification (see PasswordService.verify),
-- so a backfilled row is locked out rather than open — the same policy the
-- original migration's DEFAULT '' already established.

UPDATE "users" SET "passwordHash" = '' WHERE "passwordHash" IS NULL;

ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;
