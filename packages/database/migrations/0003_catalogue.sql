CREATE TABLE app.products (
  tenant_id uuid NOT NULL REFERENCES app.companies(id), id uuid NOT NULL,
  sku text NOT NULL CHECK (app.valid_code(sku)),
  sku_key text GENERATED ALWAYS AS (app.code_key(sku)) STORED,
  name text NOT NULL CHECK (app.valid_name(name)),
  unit_kind text NOT NULL CHECK (unit_kind IN ('piece','box','pallet','weight','volume','length')),
  unit_label text NOT NULL CHECK (app.valid_name(unit_label)),
  removed_at timestamptz,
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,sku_key)
);
CREATE TABLE app.stock_thresholds (
  tenant_id uuid NOT NULL, warehouse_id uuid NOT NULL, product_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (app.quantity_valid(quantity) AND quantity >= 0),
  PRIMARY KEY (tenant_id,warehouse_id,product_id),
  FOREIGN KEY (tenant_id,warehouse_id) REFERENCES app.warehouses(tenant_id,id),
  FOREIGN KEY (tenant_id,product_id) REFERENCES app.products(tenant_id,id)
);
