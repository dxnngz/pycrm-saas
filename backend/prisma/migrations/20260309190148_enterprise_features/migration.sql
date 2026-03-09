/*
  Warnings:

  - A unique constraint covering the columns `[id,tenant_id]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,tenant_id]` on the table `opportunities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,tenant_id]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,tenant_id]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "request_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "plan" VARCHAR(20) NOT NULL DEFAULT 'free',
ADD COLUMN     "settings" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "automations" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triggers" (
    "id" SERIAL NOT NULL,
    "automation_id" INTEGER NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" SERIAL NOT NULL,
    "trigger_id" INTEGER NOT NULL,
    "field" VARCHAR(100) NOT NULL,
    "operator" VARCHAR(20) NOT NULL,
    "value" VARCHAR(255) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" SERIAL NOT NULL,
    "automation_id" INTEGER NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_automations_tenant" ON "automations"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_triggers_automation" ON "triggers"("automation_id");

-- CreateIndex
CREATE INDEX "idx_conditions_trigger" ON "conditions"("trigger_id");

-- CreateIndex
CREATE INDEX "idx_actions_automation" ON "actions"("automation_id");

-- CreateIndex
CREATE INDEX "idx_clients_tenant_date" ON "clients"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_id_tenant_id_key" ON "clients"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "idx_contacts_tenant_date" ON "contacts"("tenant_id", "contact_date");

-- CreateIndex
CREATE INDEX "idx_documents_tenant_opp" ON "documents"("tenant_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "idx_documents_tenant_date" ON "documents"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_opps_tenant_status" ON "opportunities"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_opps_tenant_date" ON "opportunities"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_id_tenant_id_key" ON "opportunities"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_id_tenant_id_key" ON "products"("id", "tenant_id");

-- CreateIndex
CREATE INDEX "idx_tasks_tenant_completed" ON "tasks"("tenant_id", "completed");

-- CreateIndex
CREATE INDEX "idx_tasks_tenant_date" ON "tasks"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_id_tenant_id_key" ON "tasks"("id", "tenant_id");

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "triggers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
