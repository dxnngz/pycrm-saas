-- 1. Hardening Users table (MFA + Soft Delete)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
        ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_enabled') THEN
        ALTER TABLE "users" ADD COLUMN "mfa_enabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_secret') THEN
        ALTER TABLE "users" ADD COLUMN "mfa_secret" VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_recovery_codes') THEN
        ALTER TABLE "users" ADD COLUMN "mfa_recovery_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- 2. Adding Soft Delete to other core tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='deleted_at') THEN
        ALTER TABLE "clients" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='deleted_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunities' AND column_name='deleted_at') THEN
        ALTER TABLE "opportunities" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='deleted_at') THEN
        ALTER TABLE "tasks" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='deleted_at') THEN
        ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='deleted_at') THEN
        ALTER TABLE "events" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='deleted_at') THEN
        ALTER TABLE "documents" ADD COLUMN "deleted_at" TIMESTAMP(6);
    END IF;
END $$;

-- 3. Ensuring Automation Infrastructure exists
CREATE TABLE IF NOT EXISTS "automations" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "triggers" (
    "id" SERIAL NOT NULL,
    "automation_id" INTEGER NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,
    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conditions" (
    "id" SERIAL NOT NULL,
    "trigger_id" INTEGER NOT NULL,
    "field" VARCHAR(100) NOT NULL,
    "operator" VARCHAR(20) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "actions" (
    "id" SERIAL NOT NULL,
    "automation_id" INTEGER NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign Keys and Constraints (if they don't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='automations_tenant_id_fkey') THEN
        ALTER TABLE "automations" ADD CONSTRAINT "automations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
