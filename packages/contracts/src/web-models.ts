/** Wire responses shared with the web client. Decimal measures remain strings. */
export type Role = "admin" | "supervisor" | "operator";
export interface Company {
  id: string;
  code: string;
  name: string;
  timeZone: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}
export interface Session {
  company: Company;
  user: User;
  csrfToken: string;
  demoMode: boolean;
}
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  dimensions: { width: string; height: string; depth: string };
  layoutRevision: string;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: {
    kind: "piece" | "box" | "pallet" | "weight" | "volume" | "length";
    label: string;
  };
}
export interface Stock {
  warehouseId: string;
  locationId: string;
  locationCode: string;
  blocked: boolean;
  product: Product;
  physical: string;
  reserved: string;
  available: string;
}
export interface ProductTotal {
  warehouseId: string;
  product: Product;
  physical: string;
  reserved: string;
  available: string;
}
export interface Page<T> {
  data: T[];
  page: { nextCursor: string | null };
}
export interface Confirmation<T> {
  reference: string;
  status: "confirmed";
  type: string;
  confirmedAt: string;
  result: T;
}
export interface PublicConfig {
  mode: "saas" | "local";
  demoMode: boolean;
  localSetupRequired: boolean;
}
