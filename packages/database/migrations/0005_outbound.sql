CREATE TABLE app.orders (
  tenant_id uuid NOT NULL, warehouse_id uuid NOT NULL, id uuid NOT NULL,
  code text NOT NULL CHECK (app.valid_code(code)),
  code_key text GENERATED ALWAYS AS (app.code_key(code)) STORED,
  assigned_operator_id uuid, cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (tenant_id,warehouse_id,id), UNIQUE (tenant_id,warehouse_id,code_key),
  FOREIGN KEY (tenant_id,warehouse_id) REFERENCES app.warehouses(tenant_id,id),
  FOREIGN KEY (tenant_id,assigned_operator_id) REFERENCES app.users(tenant_id,id)
);
CREATE TABLE app.order_lines (
  tenant_id uuid NOT NULL, warehouse_id uuid NOT NULL, order_id uuid NOT NULL, id uuid NOT NULL, product_id uuid NOT NULL,
  requested numeric NOT NULL CHECK (app.quantity_valid(requested) AND requested > 0),
  dispatched numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(dispatched) AND dispatched >= 0 AND dispatched <= requested),
  PRIMARY KEY (tenant_id,warehouse_id,id), UNIQUE (tenant_id,warehouse_id,order_id,id,product_id),
  FOREIGN KEY (tenant_id,warehouse_id,order_id) REFERENCES app.orders(tenant_id,warehouse_id,id),
  FOREIGN KEY (tenant_id,product_id) REFERENCES app.products(tenant_id,id)
);
CREATE TABLE app.allocations (
  tenant_id uuid NOT NULL, warehouse_id uuid NOT NULL, id uuid NOT NULL,
  order_id uuid NOT NULL, line_id uuid NOT NULL, product_id uuid NOT NULL, location_id uuid NOT NULL,
  reserved numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(reserved) AND reserved >= 0),
  prepared_pending numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(prepared_pending) AND prepared_pending >= 0 AND prepared_pending <= reserved),
  PRIMARY KEY (tenant_id,warehouse_id,id), UNIQUE (tenant_id,warehouse_id,line_id,location_id),
  FOREIGN KEY (tenant_id,warehouse_id,order_id,line_id,product_id) REFERENCES app.order_lines(tenant_id,warehouse_id,order_id,id,product_id),
  FOREIGN KEY (tenant_id,warehouse_id,location_id,product_id) REFERENCES app.stock_balances(tenant_id,warehouse_id,location_id,product_id)
);
