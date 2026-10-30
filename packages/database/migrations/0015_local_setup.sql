CREATE FUNCTION app.setup_local(company_id uuid,company_code text,company_name text,company_zone text,admin_id uuid,admin_name text,admin_email text,admin_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('wms:installation',0));
  INSERT INTO app.installation(singleton,mode,schema_version) VALUES(true,'local',1) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM app.installation WHERE singleton FOR UPDATE;
  IF (SELECT i.mode FROM app.installation i WHERE i.singleton)<>'local' THEN RAISE EXCEPTION 'MODE_UNAVAILABLE'; END IF;
  IF (SELECT i.configured FROM app.installation i WHERE i.singleton) THEN RAISE EXCEPTION 'ALREADY_CONFIGURED'; END IF;
  IF NOT EXISTS(SELECT FROM pg_timezone_names WHERE name=company_zone) THEN RAISE EXCEPTION 'INVALID_TIME_ZONE'; END IF;
  IF admin_hash NOT LIKE '$argon2id$%' THEN RAISE EXCEPTION 'INVALID_CREDENTIALS'; END IF;
  INSERT INTO app.companies(id,code,name,time_zone) VALUES(company_id,company_code,company_name,company_zone);
  INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES(company_id,admin_id,admin_name,admin_email,admin_hash,'admin');
  UPDATE app.installation SET configured=true WHERE singleton;
  RETURN jsonb_build_object('company',jsonb_build_object('id',company_id,'code',company_code,'name',company_name,'timeZone',company_zone),
    'administrator',jsonb_build_object('id',admin_id,'name',admin_name,'email',admin_email,'role','admin','active',true),'loginCompanyCode',company_code);
END $$;
REVOKE ALL ON FUNCTION app.setup_local(uuid,text,text,text,uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.setup_local(uuid,text,text,text,uuid,text,text,text) TO alm_provision;
