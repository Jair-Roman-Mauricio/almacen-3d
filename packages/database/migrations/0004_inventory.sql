CREATE TABLE app.stock_balances (
  tenant_id uuid NOT NULL, warehouse_id uuid NOT NULL, location_id uuid NOT NULL, product_id uuid NOT NULL,
  physical numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(physical) AND physical >= 0),
  reserved numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(reserved) AND reserved >= 0 AND reserved <= physical),
  physical_revision bigint NOT NULL DEFAULT 0 CHECK (physical_revision >= 0),
  PRIMARY KEY (tenant_id,warehouse_id,location_id,product_id),
  FOREIGN KEY (tenant_id,warehouse_id,location_id) REFERENCES app.layout_elements(tenant_id,warehouse_id,location_id),
  FOREIGN KEY (tenant_id,product_id) REFERENCES app.products(tenant_id,id)
);
CREATE FUNCTION app.advance_physical_revision() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog AS $$
BEGIN
  NEW.physical_revision := OLD.physical_revision + CASE WHEN NEW.physical IS DISTINCT FROM OLD.physical THEN 1 ELSE 0 END;
  RETURN NEW;
END $$;
CREATE TRIGGER stock_physical_revision BEFORE UPDATE ON app.stock_balances
FOR EACH ROW EXECUTE FUNCTION app.advance_physical_revision();
CREATE TABLE app.inventory_entries (
  tenant_id uuid NOT NULL, id uuid NOT NULL, operation_reference uuid NOT NULL,
  product_id uuid NOT NULL, warehouse_id uuid NOT NULL, location_id uuid, transfer_id uuid,
  actor_id uuid NOT NULL, occurred_at timestamptz NOT NULL DEFAULT current_timestamp,
  kind text NOT NULL CHECK (length(kind) > 0), reason text,
  physical_delta numeric NOT NULL CHECK (app.quantity_valid(physical_delta)),
  reserved_delta numeric NOT NULL CHECK (app.quantity_valid(reserved_delta)),
  transit_delta numeric NOT NULL CHECK (app.quantity_valid(transit_delta)),
  PRIMARY KEY (tenant_id,id),
  FOREIGN KEY (tenant_id,warehouse_id) REFERENCES app.warehouses(tenant_id,id),
  FOREIGN KEY (tenant_id,product_id) REFERENCES app.products(tenant_id,id),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id),
  FOREIGN KEY (tenant_id,warehouse_id,location_id,product_id) REFERENCES app.stock_balances(tenant_id,warehouse_id,location_id,product_id)
);
