-- MFA tickets: server-side state for the short-lived token minted after the
-- password step. The JWT alone is stateless and therefore replayable for its
-- whole lifetime; this table makes a ticket single-use and attempt-limited.
-- Rows are created lazily on first use, keyed by the token's `jti` claim.

-- CreateTable
CREATE TABLE "mfa_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mfa_tickets_userId_idx" ON "mfa_tickets"("userId");

-- CreateIndex
CREATE INDEX "mfa_tickets_expiresAt_idx" ON "mfa_tickets"("expiresAt");

-- AddForeignKey
ALTER TABLE "mfa_tickets" ADD CONSTRAINT "mfa_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
