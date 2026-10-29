CREATE TABLE app.warehouses (
  tenant_id uuid NOT NULL REFERENCES app.companies(id), id uuid NOT NULL,
  code text NOT NULL CHECK (app.valid_code(code)),
  code_key text GENERATED ALWAYS AS (app.code_key(code)) STORED,
  name text NOT NULL CHECK (app.valid_name(name)),
  width numeric NOT NULL CHECK (app.finite_decimal(width) AND width > 0),
  height numeric NOT NULL CHECK (app.finite_decimal(height) AND height > 0),
  depth numeric NOT NULL CHECK (app.finite_decimal(depth) AND depth > 0),
  layout_revision bigint NOT NULL DEFAULT 0 CHECK (layout_revision >= 0),
  PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,code_key)
);
CREATE TABLE app.layout_elements (
  tenant_id uuid NOT NULL, warehouse_id uuid NOT NULL, id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('zone','aisle','rack','level','location')),
  parent_id uuid, parent_type text,
  code text NOT NULL CHECK (app.valid_code(code)),
  code_key text GENERATED ALWAYS AS (app.code_key(code)) STORED,
  name text NOT NULL CHECK (app.valid_name(name)),
  x numeric NOT NULL DEFAULT 0 CHECK (app.finite_decimal(x) AND x >= 0),
  y numeric NOT NULL DEFAULT 0 CHECK (app.finite_decimal(y) AND y >= 0),
  z numeric NOT NULL DEFAULT 0 CHECK (app.finite_decimal(z) AND z >= 0),
  width numeric NOT NULL CHECK (app.finite_decimal(width) AND width > 0),
  height numeric NOT NULL CHECK (app.finite_decimal(height) AND height > 0),
  depth numeric NOT NULL CHECK (app.finite_decimal(depth) AND depth > 0),
  blocked boolean NOT NULL DEFAULT false CHECK (type = 'location' OR NOT blocked),
  location_id uuid GENERATED ALWAYS AS (CASE WHEN type = 'location' THEN id END) STORED,
  PRIMARY KEY (tenant_id,warehouse_id,id),
  UNIQUE (tenant_id,warehouse_id,id,type), UNIQUE (tenant_id,warehouse_id,location_id),
  UNIQUE (tenant_id,warehouse_id,type,code_key),
  FOREIGN KEY (tenant_id,warehouse_id) REFERENCES app.warehouses(tenant_id,id),
  FOREIGN KEY (tenant_id,warehouse_id,parent_id,parent_type) REFERENCES app.layout_elements(tenant_id,warehouse_id,id,type) DEFERRABLE INITIALLY IMMEDIATE,
  CHECK ((type = 'zone' AND parent_id IS NULL AND parent_type IS NULL)
    OR (type IN ('rack','aisle') AND parent_id IS NOT NULL AND parent_type IS NOT NULL AND parent_type = 'zone')
    OR (type = 'level' AND parent_id IS NOT NULL AND parent_type IS NOT NULL AND parent_type = 'rack')
    OR (type = 'location' AND parent_id IS NOT NULL AND parent_type IS NOT NULL AND parent_type IN ('zone','level')))
);
