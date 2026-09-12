export type View = "dashboard" | "customers" | "products" | "documents" | "backup";

export type DocType =
  | "Quotation"
  | "Proforma Invoice"
  | "Sales Contract"
  | "Commercial Invoice"
  | "Packing List";

export type DocStatus = "Draft" | "Confirmed";

export type Customer = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  address: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  specification: string;
  price: number;
  unit: string;
  hsCode: string;
};

export type LineItem = {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type TradeDocument = {
  id: string;
  type: DocType;
  number: string;
  date: string;
  customerId: string;
  currency: string;
  status: DocStatus;
  items: LineItem[];
  notes: string;
  createdAt: string;
};

export type Store = {
  customers: Customer[];
  products: Product[];
  documents: TradeDocument[];
};

/** Working state of the document composer. `id` is set while editing a saved document. */
export type Draft = {
  id: string | null;
  type: DocType;
  number: string;
  date: string;
  customerId: string;
  currency: string;
  notes: string;
  lines: LineItem[];
};
