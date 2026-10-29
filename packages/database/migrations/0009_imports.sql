CREATE TABLE app.import_jobs (
  tenant_id uuid NOT NULL, id uuid NOT NULL, actor_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('catalogue','initial_stock')),
  state text NOT NULL DEFAULT 'parsing' CHECK (state IN ('parsing','preview','invalid','validated','applying','confirmed','failed')),
  file_name text NOT NULL, bytes bigint NOT NULL CHECK (bytes >= 0), row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  content_hash text CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  errors jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(errors)='array'),
  result_reference uuid, processing_ms integer CHECK (processing_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id),
  FOREIGN KEY (tenant_id,result_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED,
  CHECK (state <> 'confirmed' OR result_reference IS NOT NULL)
);
CREATE TABLE app.import_rows (
  tenant_id uuid NOT NULL, job_id uuid NOT NULL, row_no integer NOT NULL CHECK (row_no > 0),
  action text CHECK (action IN ('create','update','initial_stock')),
  values jsonb NOT NULL CHECK (jsonb_typeof(values)='object'),
  errors jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(errors)='array'),
  PRIMARY KEY (tenant_id,job_id,row_no),
  FOREIGN KEY (tenant_id,job_id) REFERENCES app.import_jobs(tenant_id,id)
);
