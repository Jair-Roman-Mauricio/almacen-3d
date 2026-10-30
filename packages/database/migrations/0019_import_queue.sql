-- Queue adapter exposes identifiers only. All data processing uses tenant RLS.
CREATE FUNCTION app.pending_import_jobs() RETURNS TABLE(tenant_id uuid,id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT j.tenant_id,j.id FROM app.import_jobs j WHERE j.state IN ('parsing','applying') ORDER BY j.created_at,j.id LIMIT 32
$$;
REVOKE ALL ON FUNCTION app.pending_import_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.pending_import_jobs() TO alm_app;
