ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(6);

CREATE INDEX IF NOT EXISTS "idx_opps_tenant_closed" ON "opportunities" ("tenant_id", "closed_at");

