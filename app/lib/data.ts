import type {
  Customer,
  DocType,
  Draft,
  LineItem,
  Product,
  Store,
  TradeDocument,
} from "./types";

export const STORAGE_KEY = "mytm-docs-v1";
export const today = new Date().toISOString().slice(0, 10);

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const docTypes: DocType[] = [
  "Quotation",
  "Proforma Invoice",
  "Sales Contract",
  "Commercial Invoice",
  "Packing List",
];

export const docShort: Record<DocType, string> = {
  Quotation: "QT",
  "Proforma Invoice": "PI",
  "Sales Contract": "SC",
  "Commercial Invoice": "CI",
  "Packing List": "PL",
};

export const docNames: Record<DocType, string> = {
  Quotation: "报价单",
  "Proforma Invoice": "形式发票",
  "Sales Contract": "销售合同",
  "Commercial Invoice": "商业发票",
  "Packing List": "装箱单",
};

export const currencies = ["USD", "EUR", "GBP", "CNY", "JPY", "AUD"];

export const DEFAULT_NOTES =
  "Validity: 30 days. Payment: 30% deposit, balance before shipment.";

export const starter: Store = {
  customers: [
    { id: "customer-demo", company: "Northstar Trading Ltd.", contact: "Emma Wilson", email: "emma@northstar.example", phone: "+44 20 7946 0188", country: "United Kingdom", address: "88 Harbor Road, London" },
    { id: "customer-demo-2", company: "Aurora Retail GmbH", contact: "Lukas Weber", email: "lukas@aurora.example", phone: "+49 30 5550 1288", country: "Germany", address: "26 Marktstraße, Berlin" },
  ],
  products: [
    { id: "product-demo", sku: "MT-1001", name: "Portable Work Light", specification: "20W / USB-C / IP65", price: 18.8, unit: "pcs", hsCode: "851310" },
    { id: "product-demo-2", sku: "MT-1002", name: "Aluminum Tool Case", specification: "460 × 330 × 150 mm", price: 32.5, unit: "set", hsCode: "420212" },
  ],
  documents: [],
};

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

export function blankLine(): LineItem {
  return { id: uid(), productId: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 };
}

export function docTotal(items: LineItem[]) {
  return items.reduce(
    (sum, x) => sum + Number(x.quantity || 0) * Number(x.unitPrice || 0),
    0,
  );
}

/** Next free number like QT-20260912-001, unique against existing documents. */
export function makeNumber(type: DocType, documents: TradeDocument[]) {
  const prefix = `${docShort[type]}-${today.replaceAll("-", "")}`;
  const taken = new Set(documents.map((d) => d.number));
  let seq = documents.filter((d) => d.number.startsWith(prefix)).length + 1;
  let number = `${prefix}-${String(seq).padStart(3, "0")}`;
  while (taken.has(number)) number = `${prefix}-${String(++seq).padStart(3, "0")}`;
  return number;
}

export function makeDraft(type: DocType, documents: TradeDocument[]): Draft {
  return {
    id: null,
    type,
    number: makeNumber(type, documents),
    date: today,
    customerId: "",
    currency: "USD",
    notes: DEFAULT_NOTES,
    lines: [blankLine()],
  };
}

export function draftFromDocument(doc: TradeDocument): Draft {
  return {
    id: doc.id,
    type: doc.type,
    number: doc.number,
    date: doc.date,
    customerId: doc.customerId,
    currency: doc.currency,
    notes: doc.notes,
    lines: doc.items.length ? doc.items.map((x) => ({ ...x })) : [blankLine()],
  };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function sanitizeCustomer(v: unknown): Customer | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const company = str(r.company).trim();
  if (!company) return null;
  return {
    id: str(r.id) || uid(),
    company,
    contact: str(r.contact),
    email: str(r.email),
    phone: str(r.phone),
    country: str(r.country),
    address: str(r.address),
  };
}

function sanitizeProduct(v: unknown): Product | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const name = str(r.name).trim();
  if (!name) return null;
  return {
    id: str(r.id) || uid(),
    sku: str(r.sku),
    name,
    specification: str(r.specification),
    price: num(r.price),
    unit: str(r.unit) || "pcs",
    hsCode: str(r.hsCode),
  };
}

function sanitizeLine(v: unknown): LineItem | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const description = str(r.description);
  if (!description.trim()) return null;
  return {
    id: str(r.id) || uid(),
    productId: str(r.productId),
    description,
    quantity: num(r.quantity),
    unit: str(r.unit) || "pcs",
    unitPrice: num(r.unitPrice),
  };
}

function sanitizeDocument(v: unknown): TradeDocument | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const type = str(r.type) as DocType;
  if (!docTypes.includes(type)) return null;
  const items = Array.isArray(r.items)
    ? r.items.map(sanitizeLine).filter((x): x is LineItem => x !== null)
    : [];
  return {
    id: str(r.id) || uid(),
    type,
    number: str(r.number) || "UNTITLED",
    date: str(r.date) || today,
    customerId: str(r.customerId),
    currency: str(r.currency) || "USD",
    status: r.status === "Confirmed" ? "Confirmed" : "Draft",
    items,
    notes: str(r.notes),
    createdAt: str(r.createdAt) || new Date().toISOString(),
  };
}

/** Strictly validate and normalize an imported backup. Returns null when unusable. */
export function parseBackup(raw: string): Store | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  if (!Array.isArray(r.customers) || !Array.isArray(r.products) || !Array.isArray(r.documents)) return null;
  return {
    customers: r.customers.map(sanitizeCustomer).filter((x): x is Customer => x !== null),
    products: r.products.map(sanitizeProduct).filter((x): x is Product => x !== null),
    documents: r.documents.map(sanitizeDocument).filter((x): x is TradeDocument => x !== null),
  };
}
