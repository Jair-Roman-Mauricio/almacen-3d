-- Authentication is verified with Argon2id in the API. The credential version and
-- active state are checked again while holding the shared permissions barrier.
CREATE FUNCTION app.create_session(company_id uuid,account_id uuid,session_id uuid,session_hash text,verified_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  PERFORM pg_advisory_xact_lock_shared(hashtextextended('wms:permissions:'||company_id::text,0));
  IF NOT EXISTS(SELECT 1 FROM app.users WHERE tenant_id=company_id AND id=account_id AND active AND password_hash=verified_hash) THEN RETURN false; END IF;
  INSERT INTO app.sessions(tenant_id,id,user_id,token_hash) VALUES(company_id,session_id,account_id,session_hash);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION app.create_session(uuid,uuid,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.create_session(uuid,uuid,uuid,text,text) TO alm_app;
REVOKE INSERT ON app.sessions FROM alm_app;
