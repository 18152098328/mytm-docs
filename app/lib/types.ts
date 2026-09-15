export type View =
  | "dashboard"
  | "customers"
  | "products"
  | "documents"
  | "settings"
  | "backup";

export type DocType =
  | "Quotation"
  | "Proforma Invoice"
  | "Sales Contract"
  | "Commercial Invoice"
  | "Packing List";

export type DocStatus = "Draft" | "Confirmed";

/** Document output language: English only, or bilingual English + Chinese. */
export type DocLanguage = "en" | "bilingual";

/** Seller identity and bank details, editable on the settings page. */
export type Seller = {
  company: string;
  address: string;
  tel: string;
  email: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
  bankSwift: string;
  bankAddress: string;
  /** Company logo as a data URL for the document letterhead; empty = built-in logo. */
  logoImage: string;
  /** Company stamp image as a data URL, shown over the signature area. */
  stampImage: string;
  /** Stamp offset in px from its default spot, set by dragging it on the preview. */
  stampX: number;
  stampY: number;
};

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
  /** Product photo as a data URL, shown on money documents. */
  image: string;
};

export type LineItem = {
  id: string;
  productId: string;
  description: string;
  /** Model / specification, shown on QT, PI and SC instead of the HS code. */
  spec: string;
  hsCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  /* packing data, used by the Packing List */
  cartons: number;
  /** Pieces per carton; when set with cartons, quantity is auto-calculated. */
  pcsPerCarton: number;
  netWeight: number;
  grossWeight: number;
  volume: number;
};

export type TradeDocument = {
  id: string;
  type: DocType;
  number: string;
  date: string;
  customerId: string;
  currency: string;
  status: DocStatus;
  language: DocLanguage;
  items: LineItem[];
  /** Minimum order quantity, shown on quotations. */
  moq: string;
  paymentTerms: string;
  notes: string;
  /* trade terms */
  incoterm: string;
  portOfLoading: string;
  portOfDestination: string;
  shippingMarks: string;
  createdAt: string;
};

export type Store = {
  seller: Seller;
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
  language: DocLanguage;
  moq: string;
  paymentTerms: string;
  notes: string;
  incoterm: string;
  portOfLoading: string;
  portOfDestination: string;
  shippingMarks: string;
  lines: LineItem[];
};
