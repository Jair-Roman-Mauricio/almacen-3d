CREATE FUNCTION app.lookup_credential(company_code text, user_email text)
RETURNS TABLE(tenant_id uuid,user_id uuid,password_hash text)
LANGUAGE sql STABLE STRICT SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
  SELECT u.tenant_id,u.id,u.password_hash FROM app.users u JOIN app.companies c ON c.id=u.tenant_id
  WHERE c.code_key=app.code_key(company_code) AND u.email_key=app.email_key(user_email) AND u.active
$$;
CREATE FUNCTION app.lookup_session(session_hash text)
RETURNS TABLE(tenant_id uuid,user_id uuid,session_id uuid)
LANGUAGE sql STABLE STRICT SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
  SELECT s.tenant_id,s.user_id,s.id FROM app.sessions s JOIN app.users u ON u.tenant_id=s.tenant_id AND u.id=s.user_id
  WHERE s.token_hash=session_hash AND s.revoked_at IS NULL AND u.active
$$;
CREATE FUNCTION app.installation_state() RETURNS TABLE(mode text,configured boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
  SELECT i.mode,i.configured FROM app.installation i WHERE i.singleton
$$;
REVOKE ALL ON FUNCTION app.lookup_credential(text,text),app.lookup_session(text),app.installation_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.lookup_credential(text,text),app.lookup_session(text) TO alm_app;
GRANT EXECUTE ON FUNCTION app.installation_state() TO alm_app,alm_provision;
