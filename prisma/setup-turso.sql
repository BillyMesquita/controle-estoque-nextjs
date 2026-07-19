CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Operador',
    "permissions" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "unit_cost" REAL NOT NULL DEFAULT 0,
    "sale_price" REAL NOT NULL DEFAULT 0,
    "current_stock" REAL NOT NULL DEFAULT 0,
    "min_stock_level" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("category_id") REFERENCES "categories" ("id"),
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id")
);

CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planejado',
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit_cost" REAL NOT NULL DEFAULT 0,
    "unit_price" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "event_id" TEXT,
    "moved_by" TEXT NOT NULL,
    "moved_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    FOREIGN KEY ("product_id") REFERENCES "products" ("id"),
    FOREIGN KEY ("moved_by") REFERENCES "users" ("id"),
    FOREIGN KEY ("event_id") REFERENCES "events" ("id")
);

CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "invoice_type" TEXT NOT NULL,
    "supplier_id" TEXT,
    "customer_name" TEXT,
    "customer_document" TEXT,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "tax_amount" REAL NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'Pendente',
    "status" TEXT NOT NULL DEFAULT 'Registrada',
    "issued_date" DATETIME NOT NULL,
    "due_date" DATETIME,
    "paid_at" DATETIME,
    "notes" TEXT,
    "registered_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id"),
    FOREIGN KEY ("registered_by") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit_cost" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("product_id") REFERENCES "products" ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "previous_values" TEXT,
    "new_values" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "system_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "system_configs_key_key" ON "system_configs"("key");

CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "products_supplier_id_idx" ON "products"("supplier_id");
CREATE INDEX IF NOT EXISTS "stock_movements_product_id_idx" ON "stock_movements"("product_id");
CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type");
CREATE INDEX IF NOT EXISTS "stock_movements_moved_at_idx" ON "stock_movements"("moved_at");
CREATE INDEX IF NOT EXISTS "stock_movements_event_id_idx" ON "stock_movements"("event_id");
CREATE INDEX IF NOT EXISTS "invoices_supplier_id_idx" ON "invoices"("supplier_id");
CREATE INDEX IF NOT EXISTS "invoices_payment_status_idx" ON "invoices"("payment_status");
CREATE INDEX IF NOT EXISTS "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_items_product_id_idx" ON "invoice_items"("product_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
