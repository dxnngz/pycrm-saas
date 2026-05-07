ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "lost_reason" VARCHAR(50);
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "lost_reason_detail" TEXT;

