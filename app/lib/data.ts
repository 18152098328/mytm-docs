import type {
  Customer,
  DocType,
  Draft,
  LineItem,
  Product,
  Seller,
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

export const incoterms = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DDP"];

export const DEFAULT_NOTES = "Validity: 30 days.";

export const DEFAULT_PAYMENT_TERMS = "30% T/T deposit, balance before shipment.";

export const defaultSeller: Seller = {
  company: "MyTM",
  address: "",
  tel: "18152098328",
  email: "",
  taxId: "",
  bankName: "",
  bankAccount: "",
  bankSwift: "",
  bankAddress: "",
  logoImage: "",
  stampImage: "",
  stampX: 0,
  stampY: 0,
};

export const starter: Store = {
  seller: defaultSeller,
  customers: [
    { id: "customer-demo", company: "Northstar Trading Ltd.", contact: "Emma Wilson", email: "emma@northstar.example", phone: "+44 20 7946 0188", country: "United Kingdom", address: "88 Harbor Road, London" },
    { id: "customer-demo-2", company: "Aurora Retail GmbH", contact: "Lukas Weber", email: "lukas@aurora.example", phone: "+49 30 5550 1288", country: "Germany", address: "26 Marktstraße, Berlin" },
  ],
  products: [
    { id: "product-demo", sku: "MT-1001", name: "Portable Work Light", specification: "20W / USB-C / IP65", price: 18.8, unit: "pcs", hsCode: "851310", image: "" },
    { id: "product-demo-2", sku: "MT-1002", name: "Aluminum Tool Case", specification: "460 × 330 × 150 mm", price: 32.5, unit: "set", hsCode: "420212", image: "" },
  ],
  documents: [],
};

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

export function blankLine(): LineItem {
  return {
    id: uid(),
    productId: "",
    description: "",
    spec: "",
    hsCode: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    cartons: 0,
    pcsPerCarton: 0,
    netWeight: 0,
    grossWeight: 0,
    volume: 0,
  };
}

export function docTotal(items: LineItem[]) {
  return items.reduce(
    (sum, x) => sum + Number(x.quantity || 0) * Number(x.unitPrice || 0),
    0,
  );
}

/** Totals for the packing list: cartons, net weight, gross weight, volume. */
export function packTotals(items: LineItem[]) {
  return items.reduce(
    (acc, x) => ({
      quantity: acc.quantity + Number(x.quantity || 0),
      cartons: acc.cartons + Number(x.cartons || 0),
      netWeight: acc.netWeight + Number(x.netWeight || 0),
      grossWeight: acc.grossWeight + Number(x.grossWeight || 0),
      volume: acc.volume + Number(x.volume || 0),
    }),
    { quantity: 0, cartons: 0, netWeight: 0, grossWeight: 0, volume: 0 },
  );
}

const ONES = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function belowThousand(n: number): string {
  let s = "";
  if (n >= 100) {
    s += ONES[Math.floor(n / 100)] + " HUNDRED";
    n %= 100;
    if (n) s += " ";
  }
  if (n >= 20) {
    s += TENS[Math.floor(n / 10)];
    if (n % 10) s += "-" + ONES[n % 10];
  } else if (n > 0) {
    s += ONES[n];
  }
  return s;
}

function integerWords(n: number): string {
  if (n === 0) return "ZERO";
  const parts: string[] = [];
  const scales: [string, number][] = [
    ["BILLION", 1_000_000_000],
    ["MILLION", 1_000_000],
    ["THOUSAND", 1_000],
  ];
  for (const [name, value] of scales) {
    if (n >= value) {
      parts.push(belowThousand(Math.floor(n / value)) + " " + name);
      n %= value;
    }
  }
  if (n > 0) parts.push(belowThousand(n));
  return parts.join(" ");
}

const currencyWords: Record<string, [string, string]> = {
  USD: ["US DOLLARS", "CENTS"],
  EUR: ["EUROS", "CENTS"],
  GBP: ["POUNDS STERLING", "PENCE"],
  CNY: ["CHINESE YUAN", "FEN"],
  JPY: ["JAPANESE YEN", ""],
  AUD: ["AUSTRALIAN DOLLARS", "CENTS"],
};

const CN_DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const CN_SMALL = ["", "拾", "佰", "仟"];
const CN_BIG = ["", "万", "亿", "万亿"];

function cnFourDigits(n: number): string {
  let s = "";
  let pendingZero = false;
  for (let i = 3; i >= 0; i--) {
    const d = Math.floor(n / 10 ** i) % 10;
    if (d === 0) {
      if (s) pendingZero = true;
    } else {
      if (pendingZero) {
        s += "零";
        pendingZero = false;
      }
      s += CN_DIGITS[d] + CN_SMALL[i];
    }
  }
  return s;
}

function cnInteger(n: number): string {
  if (n === 0) return "零";
  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 10000);
    rest = Math.floor(rest / 10000);
  }
  let s = "";
  let lastWasZero = false;
  groups.forEach((g, idx) => {
    const scale = CN_BIG[groups.length - 1 - idx];
    if (g === 0) {
      lastWasZero = s !== "";
      return;
    }
    if (s && (g < 1000 || lastWasZero)) s += "零";
    s += cnFourDigits(g) + scale;
    lastWasZero = false;
  });
  return s;
}

const currencyCn: Record<string, string> = {
  USD: "美元",
  EUR: "欧元",
  GBP: "英镑",
  CNY: "人民币",
  JPY: "日元",
  AUD: "澳元",
};

/** 中文金额大写，如 “美元玖仟肆佰元整”。 */
export function amountInWordsCn(value: number, currency: string) {
  const unit = currencyCn[currency] ?? currency;
  const noMinor = currency === "JPY";
  const safe = Math.max(0, Number(value) || 0);
  const whole = noMinor ? Math.round(safe) : Math.floor(safe + 1e-9);
  const cents = noMinor ? 0 : Math.round((safe - whole) * 100);
  const jiao = Math.floor(cents / 10);
  const fen = cents % 10;
  let s = unit + cnInteger(whole) + "元";
  if (cents === 0) {
    s += "整";
  } else {
    if (jiao > 0) s += CN_DIGITS[jiao] + "角";
    if (fen > 0) s += (jiao === 0 ? "零" : "") + CN_DIGITS[fen] + "分";
  }
  return "金额大写：" + s;
}

/** "SAY TOTAL US DOLLARS NINE THOUSAND FOUR HUNDRED ONLY." */
export function amountInWords(value: number, currency: string) {
  const [unit, cent] = currencyWords[currency] ?? [currency, "CENTS"];
  const safe = Math.max(0, Number(value) || 0);
  const whole = cent ? Math.floor(safe + 1e-9) : Math.round(safe);
  const cents = cent ? Math.round((safe - whole) * 100) : 0;
  let words = unit + " " + integerWords(whole);
  if (cents > 0) words += " AND " + cent + " " + belowThousand(cents);
  return "SAY TOTAL " + words + " ONLY.";
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
    language: "en",
    moq: "",
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    notes: DEFAULT_NOTES,
    incoterm: "",
    portOfLoading: "",
    portOfDestination: "",
    shippingMarks: "",
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
    language: doc.language,
    moq: doc.moq,
    paymentTerms: doc.paymentTerms,
    notes: doc.notes,
    incoterm: doc.incoterm,
    portOfLoading: doc.portOfLoading,
    portOfDestination: doc.portOfDestination,
    shippingMarks: doc.shippingMarks,
    lines: doc.items.length ? doc.items.map((x) => ({ ...x })) : [blankLine()],
  };
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function sanitizeSeller(v: unknown): Seller {
  if (!v || typeof v !== "object") return { ...defaultSeller };
  const r = v as Record<string, unknown>;
  return {
    company: str(r.company) || defaultSeller.company,
    address: str(r.address),
    tel: str(r.tel),
    email: str(r.email),
    taxId: str(r.taxId),
    bankName: str(r.bankName),
    bankAccount: str(r.bankAccount),
    bankSwift: str(r.bankSwift),
    bankAddress: str(r.bankAddress),
    logoImage: str(r.logoImage),
    stampImage: str(r.stampImage),
    stampX: num(r.stampX),
    stampY: num(r.stampY),
  };
}

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
    image: str(r.image),
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
    spec: str(r.spec),
    hsCode: str(r.hsCode),
    quantity: num(r.quantity),
    unit: str(r.unit) || "pcs",
    unitPrice: num(r.unitPrice),
    cartons: num(r.cartons),
    pcsPerCarton: num(r.pcsPerCarton),
    netWeight: num(r.netWeight),
    grossWeight: num(r.grossWeight),
    volume: num(r.volume),
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
    language: r.language === "bilingual" ? "bilingual" : "en",
    items,
    moq: str(r.moq),
    paymentTerms: str(r.paymentTerms),
    notes: str(r.notes),
    incoterm: str(r.incoterm),
    portOfLoading: str(r.portOfLoading),
    portOfDestination: str(r.portOfDestination),
    shippingMarks: str(r.shippingMarks),
    createdAt: str(r.createdAt) || new Date().toISOString(),
  };
}

/**
 * Strictly validate and normalize an imported backup or saved workspace.
 * Older data without seller/packing/trade fields is migrated with defaults.
 * Returns null when unusable.
 */
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
    seller: sanitizeSeller(r.seller),
    customers: r.customers.map(sanitizeCustomer).filter((x): x is Customer => x !== null),
    products: r.products.map(sanitizeProduct).filter((x): x is Product => x !== null),
    documents: r.documents.map(sanitizeDocument).filter((x): x is TradeDocument => x !== null),
  };
}
