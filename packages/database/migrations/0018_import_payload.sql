-- Durable staging permits parsing again after a worker restart. Never business stock.
ALTER TABLE app.import_jobs ADD COLUMN payload bytea;
ALTER TABLE app.import_jobs ADD COLUMN warehouse_id uuid;
ALTER TABLE app.import_jobs ADD FOREIGN KEY (tenant_id,warehouse_id) REFERENCES app.warehouses(tenant_id,id);
ALTER TABLE app.import_jobs ADD CHECK ((kind='catalogue' AND warehouse_id IS NULL) OR (kind='initial_stock' AND warehouse_id IS NOT NULL));
ALTER TABLE app.import_rows ADD COLUMN source_errors jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(source_errors)='array');
ALTER TABLE app.import_jobs ADD COLUMN application_queued_at timestamptz;
GRANT UPDATE(application_queued_at) ON app.import_jobs TO alm_app;
