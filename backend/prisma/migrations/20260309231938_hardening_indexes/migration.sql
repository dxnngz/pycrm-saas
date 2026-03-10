-- CreateIndex
CREATE INDEX "idx_audit_tenant_date" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_clients_tenant_status" ON "clients"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_products_tenant_date" ON "products"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_users_tenant_date" ON "users"("tenant_id", "created_at");
