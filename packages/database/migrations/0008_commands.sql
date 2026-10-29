CREATE TABLE app.commands (
  tenant_id uuid NOT NULL REFERENCES app.companies(id), reference uuid NOT NULL,
  operation_type text NOT NULL CHECK (length(operation_type) > 0),
  data_hash text NOT NULL CHECK (data_hash ~ '^[0-9a-f]{64}$'), actor_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','confirmed')),
  result jsonb, confirmed_at timestamptz, created_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (tenant_id,reference),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id),
  CHECK ((state='pending' AND result IS NULL AND confirmed_at IS NULL) OR (state='confirmed' AND result IS NOT NULL AND jsonb_typeof(result)='object' AND confirmed_at IS NOT NULL))
);
CREATE TABLE app.audit_events (
  tenant_id uuid NOT NULL, id uuid NOT NULL, operation_reference uuid NOT NULL, actor_id uuid NOT NULL,
  kind text NOT NULL CHECK (length(kind)>0), entity_id uuid NOT NULL, reason text,
  occurred_at timestamptz NOT NULL DEFAULT current_timestamp, details jsonb NOT NULL CHECK (jsonb_typeof(details)='object'),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id),
  FOREIGN KEY (tenant_id,operation_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE app.change_outbox (
  tenant_id uuid NOT NULL, id uuid NOT NULL, operation_reference uuid NOT NULL,
  scopes jsonb NOT NULL CHECK (jsonb_typeof(scopes)='array'),
  created_at timestamptz NOT NULL DEFAULT current_timestamp, published_at timestamptz,
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,operation_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE app.inventory_entries ADD FOREIGN KEY (tenant_id,operation_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE app.transfers ADD FOREIGN KEY (tenant_id,departure_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE app.transfer_receipts ADD FOREIGN KEY (tenant_id,operation_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE app.counts ADD FOREIGN KEY (tenant_id,operation_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE app.adjustments ADD FOREIGN KEY (tenant_id,operation_reference) REFERENCES app.commands(tenant_id,reference) DEFERRABLE INITIALLY DEFERRED;
