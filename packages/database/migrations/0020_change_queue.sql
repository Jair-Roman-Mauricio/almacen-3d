-- Metadata only. Notice payloads are read under the target company's RLS.
CREATE FUNCTION app.pending_change_tenants() RETURNS TABLE(tenant_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT DISTINCT o.tenant_id FROM app.change_outbox o WHERE o.published_at IS NULL LIMIT 1000
$$;
REVOKE ALL ON FUNCTION app.pending_change_tenants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.pending_change_tenants() TO alm_app;
CREATE INDEX change_outbox_pending ON app.change_outbox(tenant_id,created_at,id) WHERE published_at IS NULL;
