-- Align RecuperacaoSenha table with current Prisma schema without dropping data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add new columns as nullable first to allow backfill
ALTER TABLE "RecuperacaoSenha"
ADD COLUMN IF NOT EXISTS "token_hash" TEXT,
ADD COLUMN IF NOT EXISTS "expira_em" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "usado_em" TIMESTAMP(3);

-- 2) Backfill token_hash from old plain token and set a safe expiration for legacy rows
UPDATE "RecuperacaoSenha"
SET
  "token_hash" = COALESCE("token_hash", encode(digest("token", 'sha256'), 'hex')),
  "expira_em" = COALESCE("expira_em", "criado_em" + INTERVAL '15 minutes')
WHERE
  "token_hash" IS NULL
  OR "expira_em" IS NULL;

-- 3) Enforce the new constraints
ALTER TABLE "RecuperacaoSenha"
ALTER COLUMN "token_hash" SET NOT NULL,
ALTER COLUMN "expira_em" SET NOT NULL;

-- 4) Replace old unique index on token with unique index on token_hash
DROP INDEX IF EXISTS "RecuperacaoSenha_token_key";
CREATE UNIQUE INDEX IF NOT EXISTS "RecuperacaoSenha_token_hash_key" ON "RecuperacaoSenha"("token_hash");

-- 5) Add index required by schema
CREATE INDEX IF NOT EXISTS "RecuperacaoSenha_expira_em_idx" ON "RecuperacaoSenha"("expira_em");

-- 6) Remove old column no longer used by application
ALTER TABLE "RecuperacaoSenha"
DROP COLUMN IF EXISTS "token";
