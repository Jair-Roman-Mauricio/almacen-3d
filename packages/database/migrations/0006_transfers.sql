CREATE TABLE app.transfers (
  tenant_id uuid NOT NULL, id uuid NOT NULL,
  code text NOT NULL CHECK (app.valid_code(code)), code_key text GENERATED ALWAYS AS (app.code_key(code)) STORED,
  source_warehouse_id uuid NOT NULL, target_warehouse_id uuid NOT NULL,
  departure_reference uuid, departed_at timestamptz, created_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,code_key), UNIQUE (tenant_id,id,source_warehouse_id,target_warehouse_id),
  UNIQUE (tenant_id,departure_reference),
  FOREIGN KEY (tenant_id,source_warehouse_id) REFERENCES app.warehouses(tenant_id,id),
  FOREIGN KEY (tenant_id,target_warehouse_id) REFERENCES app.warehouses(tenant_id,id),
  CHECK (source_warehouse_id <> target_warehouse_id)
);
CREATE TABLE app.transfer_lines (
  tenant_id uuid NOT NULL, transfer_id uuid NOT NULL, id uuid NOT NULL,
  source_warehouse_id uuid NOT NULL, target_warehouse_id uuid NOT NULL, source_location_id uuid NOT NULL, product_id uuid NOT NULL,
  declared numeric NOT NULL CHECK (app.quantity_valid(declared) AND declared > 0),
  departed numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(departed) AND departed IN (0,declared)),
  received numeric NOT NULL DEFAULT 0 CHECK (app.quantity_valid(received) AND received >= 0 AND received <= departed),
  in_transit numeric GENERATED ALWAYS AS (departed-received) STORED,
  PRIMARY KEY (tenant_id,transfer_id,id), UNIQUE (tenant_id,transfer_id,id,product_id,target_warehouse_id),
  FOREIGN KEY (tenant_id,transfer_id,source_warehouse_id,target_warehouse_id) REFERENCES app.transfers(tenant_id,id,source_warehouse_id,target_warehouse_id),
  FOREIGN KEY (tenant_id,source_warehouse_id,source_location_id,product_id) REFERENCES app.stock_balances(tenant_id,warehouse_id,location_id,product_id)
);
CREATE TABLE app.transfer_receipts (
  tenant_id uuid NOT NULL, id uuid NOT NULL, transfer_id uuid NOT NULL, operation_reference uuid NOT NULL, actor_id uuid NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,transfer_id,id), UNIQUE (tenant_id,operation_reference),
  FOREIGN KEY (tenant_id,transfer_id) REFERENCES app.transfers(tenant_id,id),
  FOREIGN KEY (tenant_id,actor_id) REFERENCES app.users(tenant_id,id)
);
CREATE TABLE app.transfer_receipt_lines (
  tenant_id uuid NOT NULL, receipt_id uuid NOT NULL, transfer_id uuid NOT NULL, line_id uuid NOT NULL,
  product_id uuid NOT NULL, target_warehouse_id uuid NOT NULL, target_location_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (app.quantity_valid(quantity) AND quantity > 0),
  PRIMARY KEY (tenant_id,receipt_id,line_id,target_location_id),
  FOREIGN KEY (tenant_id,transfer_id,receipt_id) REFERENCES app.transfer_receipts(tenant_id,transfer_id,id),
  FOREIGN KEY (tenant_id,transfer_id,line_id,product_id,target_warehouse_id) REFERENCES app.transfer_lines(tenant_id,transfer_id,id,product_id,target_warehouse_id),
  FOREIGN KEY (tenant_id,target_warehouse_id,target_location_id,product_id) REFERENCES app.stock_balances(tenant_id,warehouse_id,location_id,product_id)
);
ALTER TABLE app.inventory_entries ADD FOREIGN KEY (tenant_id,transfer_id) REFERENCES app.transfers(tenant_id,id);
