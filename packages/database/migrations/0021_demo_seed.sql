CREATE TABLE app.demo_seed(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),mode text NOT NULL CHECK(mode IN('saas','local')),version integer NOT NULL CHECK(version=1));
CREATE TABLE app.demo_accounts(tenant_id uuid NOT NULL,user_id uuid NOT NULL,manifest_key text NOT NULL UNIQUE,role text NOT NULL CHECK(role IN('admin','supervisor','operator')),PRIMARY KEY(tenant_id,user_id),FOREIGN KEY(tenant_id,user_id) REFERENCES app.users(tenant_id,id));
ALTER TABLE app.demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.demo_accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_access ON app.demo_accounts TO alm_app USING(tenant_id=(SELECT nullif(current_setting('app.tenant_id',true),'')::uuid));
CREATE POLICY migration_access ON app.demo_accounts TO alm_migrator USING(true) WITH CHECK(true);
GRANT SELECT ON app.demo_accounts TO alm_app;
CREATE FUNCTION app.initialize_demo(seed_mode text,seed_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE company record; account record;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('wms:installation',0));
 IF seed_mode NOT IN('saas','local') THEN RAISE EXCEPTION 'MODE_UNAVAILABLE'; END IF;
 IF EXISTS(SELECT FROM app.demo_seed) THEN
  IF (SELECT mode FROM app.demo_seed)<>seed_mode THEN RAISE EXCEPTION 'MODE_UNAVAILABLE'; END IF;
  RETURN;
 END IF;
 IF EXISTS(SELECT FROM app.companies) THEN RAISE EXCEPTION 'DEMO_REQUIRES_EMPTY_DATABASE'; END IF;
 IF seed_hash NOT LIKE '$argon2id$%' THEN RAISE EXCEPTION 'INVALID_CREDENTIALS'; END IF;
 INSERT INTO app.installation(singleton,mode,schema_version) VALUES(true,seed_mode,1) ON CONFLICT DO NOTHING;
 IF (SELECT mode FROM app.installation WHERE singleton)<>seed_mode THEN RAISE EXCEPTION 'MODE_UNAVAILABLE'; END IF;
 INSERT INTO app.demo_seed(singleton,mode,version) VALUES(true,seed_mode,1);
 FOR company IN SELECT * FROM (VALUES
  ('d0000000-0000-4000-8000-000000000001'::uuid,'DEMO-ROBOTICA','Robótica ficticia — demostración','d1000000'),
  ('d0000000-0000-4000-8000-000000000002'::uuid,'DEMO-COMERCIO','Comercio ficticio — demostración','d2000000')) c(id,code,name,prefix)
  WHERE seed_mode='saas' OR c.code='DEMO-ROBOTICA'
 LOOP
  INSERT INTO app.companies(id,code,name,time_zone) VALUES(company.id,company.code,company.name,'America/Lima');
  FOR account IN SELECT * FROM(VALUES('admin',1),('supervisor',2),('operator',3)) u(role,number) LOOP
   INSERT INTO app.users(tenant_id,id,name,email,password_hash,role) VALUES(company.id,(company.prefix||'-0000-4000-8000-'||lpad(account.number::text,12,'0'))::uuid,'Cuenta ficticia — '||account.role,account.role||'@demo.example.test',seed_hash,account.role);
   INSERT INTO app.demo_accounts(tenant_id,user_id,manifest_key,role) VALUES(company.id,(company.prefix||'-0000-4000-8000-'||lpad(account.number::text,12,'0'))::uuid,company.code||':'||account.role,account.role);
  END LOOP;
 END LOOP;
 IF seed_mode='local' THEN UPDATE app.installation SET configured=true WHERE singleton; END IF;
END $$;
CREATE FUNCTION app.demo_manifest_keys() RETURNS TABLE(manifest_key text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT d.manifest_key FROM app.demo_accounts d JOIN app.users u ON(u.tenant_id,u.id)=(d.tenant_id,d.user_id) WHERE u.active AND u.role=d.role AND EXISTS(SELECT FROM app.demo_seed)
$$;
REVOKE ALL ON FUNCTION app.initialize_demo(text,text),app.demo_manifest_keys() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.initialize_demo(text,text) TO alm_provision;
GRANT EXECUTE ON FUNCTION app.demo_manifest_keys() TO alm_app;
