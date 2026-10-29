CREATE TABLE app.counts (
  tenant_id uuid NOT NULL, id uuid NOT NULL, warehouse_id uuid NOT NULL, location_id uuid NOT NULL, product_id uuid NOT NULL,
  observed numeric NOT NULL CHECK (app.quantity_valid(observed) AND observed >= 0),
  reference_physical numeric NOT NULL CHECK (app.quantity_valid(reference_physical) AND reference_physical >= 0),
  reference_revision bigint NOT NULL CHECK (reference_revision >= 0),
  difference numeric GENERATED ALWAYS AS (observed-reference_physical) STORED,
  actor_id uuid NOT NULL, operation_reference uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT current_timestamp, adjusted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,warehouse_id,id,location_id,product_id), UNIQUE (tenant_id,operation_reference),
  FOREIGN KEY (tenant_id,warehouse_id,location_id,product_id) REFERENCES app.stock_balances(tenant_id,warehouse_id,location_id,product_id),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id)
);
CREATE TABLE app.adjustments (
  tenant_id uuid NOT NULL, id uuid NOT NULL, warehouse_id uuid NOT NULL, count_id uuid NOT NULL,
  location_id uuid NOT NULL, product_id uuid NOT NULL,
  authorized_physical numeric NOT NULL CHECK (app.quantity_valid(authorized_physical) AND authorized_physical >= 0),
  reason text NOT NULL CHECK (length(app.trim_text(reason)) > 0),
  actor_id uuid NOT NULL, operation_reference uuid NOT NULL, confirmed_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,count_id), UNIQUE (tenant_id,operation_reference),
  FOREIGN KEY (tenant_id,warehouse_id,count_id,location_id,product_id) REFERENCES app.counts(tenant_id,warehouse_id,id,location_id,product_id),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id)
);
