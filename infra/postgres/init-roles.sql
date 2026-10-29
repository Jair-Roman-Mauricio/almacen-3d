\getenv migration_password PG_MIGRATION_PASSWORD
\getenv app_password PG_APP_PASSWORD
BEGIN;
CREATE ROLE alm_migrator LOGIN PASSWORD :'migration_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE alm_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA app AUTHORIZATION alm_migrator;
GRANT USAGE ON SCHEMA app TO alm_app;
SELECT format('GRANT CONNECT ON DATABASE %I TO alm_migrator, alm_app', current_database()) \gexec
SELECT format('GRANT CREATE ON DATABASE %I TO alm_migrator', current_database()) \gexec
ALTER ROLE alm_migrator SET search_path TO app, public;
ALTER ROLE alm_app SET search_path TO app, public;
COMMIT;
