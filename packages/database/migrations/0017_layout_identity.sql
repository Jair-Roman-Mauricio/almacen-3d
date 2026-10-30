-- Keep historical stock/work foreign keys intact when an empty element leaves
-- the active layout. A draft UUID cannot acquire another warehouse identity.
ALTER TABLE app.layout_elements ADD COLUMN removed_at timestamptz;
ALTER TABLE app.layout_elements ADD CONSTRAINT layout_element_identity UNIQUE(tenant_id,id);
ALTER TABLE app.layout_elements DROP CONSTRAINT layout_elements_tenant_id_warehouse_id_type_code_key_key;
CREATE UNIQUE INDEX layout_element_active_code ON app.layout_elements(tenant_id,warehouse_id,type,code_key) WHERE removed_at IS NULL;
GRANT UPDATE(removed_at) ON app.layout_elements TO alm_app;
