-- AlterTable
ALTER TABLE "automations" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "idx_audit_global_date" ON "audit_logs"("created_at");
