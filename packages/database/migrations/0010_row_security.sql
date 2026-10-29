REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC, alm_app, alm_provision;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app FROM PUBLIC, alm_app, alm_provision;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE CREATE ON SCHEMA app FROM PUBLIC, alm_app, alm_provision;
GRANT USAGE ON SCHEMA app TO alm_app, alm_provision;
GRANT EXECUTE ON FUNCTION app.trim_text(text),app.code_key(text),app.email_key(text),app.valid_code(text),app.valid_name(text),app.finite_decimal(numeric),app.quantity_valid(numeric) TO alm_app;
DO $$
DECLARE target record; tenant_column text;
BEGIN
  FOR target IN
    SELECT c.table_name FROM information_schema.columns c
    WHERE c.table_schema='app' AND c.column_name='tenant_id'
    UNION SELECT 'companies'
  LOOP
    tenant_column := CASE WHEN target.table_name='companies' THEN 'id' ELSE 'tenant_id' END;
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',target.table_name);
    EXECUTE format('ALTER TABLE app.%I FORCE ROW LEVEL SECURITY',target.table_name);
    EXECUTE format('CREATE POLICY tenant_access ON app.%I TO alm_app USING (%I = (SELECT nullif(current_setting(''app.tenant_id'',true),'''')::uuid)) WITH CHECK (%I = (SELECT nullif(current_setting(''app.tenant_id'',true),'''')::uuid))',target.table_name,tenant_column,tenant_column);
    EXECUTE format('CREATE POLICY migration_access ON app.%I TO alm_migrator USING (true) WITH CHECK (true)',target.table_name);
    EXECUTE format('GRANT SELECT, INSERT ON app.%I TO alm_app',target.table_name);
  END LOOP;
END $$;
GRANT UPDATE (name,time_zone) ON app.companies TO alm_app;
GRANT UPDATE (name,role,active) ON app.users TO alm_app;
GRANT UPDATE (revoked_at) ON app.sessions TO alm_app;
GRANT UPDATE (name,width,height,depth,layout_revision) ON app.warehouses TO alm_app;
GRANT UPDATE (parent_id,parent_type,code,name,x,y,z,width,height,depth,blocked), DELETE ON app.layout_elements TO alm_app;
GRANT UPDATE (name,removed_at) ON app.products TO alm_app;
GRANT UPDATE (quantity) ON app.stock_thresholds TO alm_app;
GRANT UPDATE (physical,reserved) ON app.stock_balances TO alm_app;
GRANT UPDATE (assigned_operator_id,cancelled) ON app.orders TO alm_app;
GRANT UPDATE (dispatched) ON app.order_lines TO alm_app;
GRANT UPDATE (reserved,prepared_pending) ON app.allocations TO alm_app;
GRANT UPDATE (departure_reference,departed_at) ON app.transfers TO alm_app;
GRANT UPDATE (departed,received) ON app.transfer_lines TO alm_app;
GRANT UPDATE (adjusted) ON app.counts TO alm_app;
GRANT UPDATE (state,result,confirmed_at) ON app.commands TO alm_app;
GRANT UPDATE (published_at) ON app.change_outbox TO alm_app;
GRANT UPDATE (state,row_count,content_hash,errors,result_reference,processing_ms) ON app.import_jobs TO alm_app;
GRANT UPDATE (action,values,errors) ON app.import_rows TO alm_app;
-- Company registration will use the limited provisioning adapter (T038–T042).
REVOKE INSERT ON app.companies FROM alm_app;
