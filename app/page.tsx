"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type View = "dashboard" | "customers" | "products" | "documents" | "backup";
type DocType = "Quotation" | "Proforma Invoice" | "Sales Contract" | "Commercial Invoice" | "Packing List";

type Customer = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  address: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  specification: string;
  price: number;
  unit: string;
  hsCode: string;
};

type LineItem = {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

type TradeDocument = {
  id: string;
  type: DocType;
  number: string;
  date: string;
  customerId: string;
  currency: string;
  status: "Draft" | "Confirmed";
  items: LineItem[];
  notes: string;
  createdAt: string;
};

type Store = { customers: Customer[]; products: Product[]; documents: TradeDocument[] };

const STORAGE_KEY = "mytm-docs-v1";
const today = new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const starter: Store = {
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

const nav: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "工作台", icon: "◈" },
  { id: "customers", label: "客户资料", icon: "◉" },
  { id: "products", label: "商品资料", icon: "▦" },
  { id: "documents", label: "外贸单据", icon: "▤" },
  { id: "backup", label: "备份恢复", icon: "⇅" },
];

const docTypes: DocType[] = ["Quotation", "Proforma Invoice", "Sales Contract", "Commercial Invoice", "Packing List"];
const docShort: Record<DocType, string> = { Quotation: "QT", "Proforma Invoice": "PI", "Sales Contract": "SC", "Commercial Invoice": "CI", "Packing List": "PL" };

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

function blankLine(): LineItem {
  return { id: uid(), productId: "", description: "", quantity: 1, unit: "pcs", unitPrice: 0 };
}

function makeNumber(type: DocType) {
  return `${docShort[type]}-${today.replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [store, setStore] = useState<Store>(starter);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [customerForm, setCustomerForm] = useState<Omit<Customer, "id">>({ company: "", contact: "", email: "", phone: "", country: "", address: "" });
  const [productForm, setProductForm] = useState<Omit<Product, "id">>({ sku: "", name: "", specification: "", price: 0, unit: "pcs", hsCode: "" });
  const [docType, setDocType] = useState<DocType>("Quotation");
  const [docNumber, setDocNumber] = useState(makeNumber("Quotation"));
  const [docDate, setDocDate] = useState(today);
  const [customerId, setCustomerId] = useState("customer-demo");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("Validity: 30 days. Payment: 30% deposit, balance before shipment.");
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStore(JSON.parse(saved));
    } catch { /* keep starter data */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, loaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedCustomer = store.customers.find((x) => x.id === customerId);
  const total = useMemo(() => lines.reduce((sum, x) => sum + Number(x.quantity || 0) * Number(x.unitPrice || 0), 0), [lines]);
  const confirmed = store.documents.filter((x) => x.status === "Confirmed").length;

  function addCustomer(event: FormEvent) {
    event.preventDefault();
    if (!customerForm.company.trim()) return;
    const item = { id: uid(), ...customerForm };
    setStore((s) => ({ ...s, customers: [item, ...s.customers] }));
    setCustomerForm({ company: "", contact: "", email: "", phone: "", country: "", address: "" });
    setCustomerId(item.id);
    setToast("客户已保存");
  }

  function addProduct(event: FormEvent) {
    event.preventDefault();
    if (!productForm.name.trim()) return;
    setStore((s) => ({ ...s, products: [{ id: uid(), ...productForm, price: Number(productForm.price) }, ...s.products] }));
    setProductForm({ sku: "", name: "", specification: "", price: 0, unit: "pcs", hsCode: "" });
    setToast("商品已保存");
  }

  function chooseProduct(lineId: string, productId: string) {
    const product = store.products.find((x) => x.id === productId);
    setLines((current) => current.map((line) => line.id === lineId ? {
      ...line,
      productId,
      description: product ? `${product.name}${product.specification ? ` · ${product.specification}` : ""}` : "",
      unit: product?.unit || "pcs",
      unitPrice: product?.price || 0,
    } : line));
  }

  function updateLine(lineId: string, field: keyof LineItem, value: string | number) {
    setLines((current) => current.map((line) => line.id === lineId ? { ...line, [field]: value } : line));
  }

  function changeDocType(type: DocType) {
    setDocType(type);
    setDocNumber(makeNumber(type));
  }

  function saveDocument(status: TradeDocument["status"]) {
    const cleanLines = lines.filter((x) => x.description.trim());
    if (!customerId || !cleanLines.length) {
      setToast("请选择客户并添加至少一项商品");
      return;
    }
    const doc: TradeDocument = { id: uid(), type: docType, number: docNumber, date: docDate, customerId, currency, status, items: cleanLines, notes, createdAt: new Date().toISOString() };
    setStore((s) => ({ ...s, documents: [doc, ...s.documents] }));
    setToast(status === "Confirmed" ? "单据已确认" : "草稿已保存");
  }

  function startDocument() {
    setLines([blankLine()]);
    setDocNumber(makeNumber(docType));
    setView("documents");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MyTM-Docs-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("备份已导出");
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.customers) || !Array.isArray(data.products) || !Array.isArray(data.documents)) throw new Error();
        setStore(data);
        setToast("备份已恢复");
      } catch { setToast("备份文件无法识别"); }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("dashboard")} aria-label="MyTM Docs 首页">
          <img src="/mytm-logo.png" alt="MyTM Docs" />
          <span><b>MyTM Docs</b><small>LOCAL TRADE DESK</small></span>
        </button>
        <nav>
          {nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><i>{item.icon}</i>{item.label}</button>)}
        </nav>
        <div className="sidebar-foot">
          <span className="status-dot" />
          <div><b>本地模式</b><small>数据仅保存在此设备</small></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">MYTM BUSINESS OPERATIONS</p>
            <h1>{nav.find((x) => x.id === view)?.label}</h1>
          </div>
          <div className="top-actions"><span className="phone">TEL&nbsp; 18152098328</span><button className="primary" onClick={startDocument}>+　新建单据</button></div>
        </header>

        {view === "dashboard" && (
          <div className="page dashboard-page">
            <section className="hero-card">
              <div><span className="hero-kicker">LOCAL-FIRST · PRIVATE · READY</span><h2>从客户资料到正式单据，<br />让外贸工作更清晰。</h2><p>客户、商品与单据关联保存。数据留在你的电脑，随时备份。</p><button className="hero-cta" onClick={startDocument}>开始制单 <span>→</span></button></div>
              <div className="hero-mark"><img src="/mytm-logo.png" alt="" /><div className="orbit one" /><div className="orbit two" /></div>
            </section>
            <section className="metric-grid">
              <article><span className="metric-icon blue">◉</span><div><small>客户数</small><strong>{store.customers.length}</strong><p>可直接复用于新单据</p></div></article>
              <article><span className="metric-icon cyan">▦</span><div><small>商品数</small><strong>{store.products.length}</strong><p>已保存 SKU 与价格</p></div></article>
              <article><span className="metric-icon amber">▤</span><div><small>单据总数</small><strong>{store.documents.length}</strong><p>{confirmed} 份已确认</p></div></article>
            </section>
            <section className="split-grid">
              <div className="panel"><div className="panel-head"><div><p className="eyebrow">快速起步</p><h3>今天做什么？</h3></div></div><div className="quick-grid">
                {[{ icon: "QT", title: "新建报价单", desc: "Quotation", type: "Quotation" as DocType }, { icon: "PI", title: "新建形式发票", desc: "Proforma Invoice", type: "Proforma Invoice" as DocType }, { icon: "CI", title: "新建商业发票", desc: "Commercial Invoice", type: "Commercial Invoice" as DocType }, { icon: "PL", title: "新建装箱单", desc: "Packing List", type: "Packing List" as DocType }].map((x) => <button key={x.icon} onClick={() => { changeDocType(x.type); setView("documents"); }}><b>{x.icon}</b><span>{x.title}<small>{x.desc}</small></span><i>↗</i></button>)}
              </div></div>
              <div className="panel"><div className="panel-head"><div><p className="eyebrow">RECENT DOCUMENTS</p><h3>最近单据</h3></div><button className="text-button" onClick={() => setView("documents")}>查看全部</button></div>{store.documents.length ? <div className="recent-list">{store.documents.slice(0, 5).map((doc) => <div key={doc.id}><span className="doc-badge">{docShort[doc.type]}</span><div><b>{doc.number}</b><small>{store.customers.find((x) => x.id === doc.customerId)?.company}</small></div><span className={`tag ${doc.status === "Confirmed" ? "confirmed" : ""}`}>{doc.status === "Confirmed" ? "已确认" : "草稿"}</span></div>)}</div> : <div className="empty-state"><span>▤</span><b>还没有单据</b><p>创建第一份报价单后，会显示在这里。</p></div>}</div>
            </section>
          </div>
        )}

        {view === "customers" && (
          <div className="page two-column">
            <form className="panel form-panel" onSubmit={addCustomer}><div className="panel-head"><div><p className="eyebrow">CUSTOMER PROFILE</p><h3>新建客户</h3></div></div><label>公司名称<input required value={customerForm.company} onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })} placeholder="Company name" /></label><div className="field-row"><label>联系人<input value={customerForm.contact} onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })} /></label><label>国家/地区<input value={customerForm.country} onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })} /></label></div><div className="field-row"><label>邮箱<input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} /></label><label>电话<input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} /></label></div><label>地址<textarea value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} /></label><button className="primary wide">保存客户</button></form>
            <section className="panel list-panel"><div className="panel-head"><div><p className="eyebrow">{store.customers.length} RECORDS</p><h3>客户列表</h3></div></div><div className="card-list">{store.customers.map((item) => <article key={item.id}><span className="avatar">{item.company.slice(0, 2).toUpperCase()}</span><div className="card-main"><b>{item.company}</b><p>{item.contact || "未填写联系人"} · {item.country || "未填写国家"}</p><small>{item.email || item.phone || "暂无联系方式"}</small></div><button className="danger-ghost" onClick={() => setStore((s) => ({ ...s, customers: s.customers.filter((x) => x.id !== item.id) }))} aria-label={`删除 ${item.company}`}>×</button></article>)}</div></section>
          </div>
        )}

        {view === "products" && (
          <div className="page two-column">
            <form className="panel form-panel" onSubmit={addProduct}><div className="panel-head"><div><p className="eyebrow">PRODUCT MASTER</p><h3>新建商品</h3></div></div><div className="field-row"><label>SKU<input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} /></label><label>HS Code<input value={productForm.hsCode} onChange={(e) => setProductForm({ ...productForm, hsCode: e.target.value })} /></label></div><label>商品名称<input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></label><label>规格描述<textarea value={productForm.specification} onChange={(e) => setProductForm({ ...productForm, specification: e.target.value })} /></label><div className="field-row"><label>参考单价<input type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} /></label><label>单位<input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} /></label></div><button className="primary wide">保存商品</button></form>
            <section className="panel list-panel"><div className="panel-head"><div><p className="eyebrow">{store.products.length} RECORDS</p><h3>商品列表</h3></div></div><div className="product-table"><div className="table-head"><span>SKU / 商品</span><span>规格</span><span>价格</span><span /></div>{store.products.map((item) => <div className="table-row" key={item.id}><span><b>{item.sku || "NO SKU"}</b><small>{item.name}</small></span><span>{item.specification || "—"}</span><span><b>{money(item.price)}</b><small>/ {item.unit}</small></span><button className="danger-ghost" onClick={() => setStore((s) => ({ ...s, products: s.products.filter((x) => x.id !== item.id) }))} aria-label={`删除 ${item.name}`}>×</button></div>)}</div></section>
          </div>
        )}

        {view === "documents" && (
          <div className="page document-page">
            <section className="panel composer no-print"><div className="panel-head"><div><p className="eyebrow">DOCUMENT COMPOSER</p><h3>单据编辑器</h3></div><span className="autosave">● 本地存储</span></div>
              <div className="doc-type-tabs">{docTypes.map((type) => <button key={type} className={docType === type ? "active" : ""} onClick={() => changeDocType(type)}>{docShort[type]}<small>{type}</small></button>)}</div>
              <div className="field-row three"><label>单据号<input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} /></label><label>日期<input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} /></label><label>币种<select value={currency} onChange={(e) => setCurrency(e.target.value)}>{["USD", "EUR", "GBP", "CNY", "JPY", "AUD"].map((x) => <option key={x}>{x}</option>)}</select></label></div>
              <label>客户<select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>{store.customers.map((x) => <option key={x.id} value={x.id}>{x.company}</option>)}</select></label>
              <div className="line-editor"><div className="line-head"><span>商品</span><span>描述</span><span>数量</span><span>单位</span><span>单价</span><span /></div>{lines.map((line) => <div className="line-row" key={line.id}><select value={line.productId} onChange={(e) => chooseProduct(line.id, e.target.value)}><option value="">自定义项</option>{store.products.map((x) => <option key={x.id} value={x.id}>{x.sku} · {x.name}</option>)}</select><input value={line.description} onChange={(e) => updateLine(line.id, "description", e.target.value)} placeholder="Description" /><input type="number" min="0" value={line.quantity} onChange={(e) => updateLine(line.id, "quantity", Number(e.target.value))} /><input value={line.unit} onChange={(e) => updateLine(line.id, "unit", e.target.value)} /><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(line.id, "unitPrice", Number(e.target.value))} /><button className="danger-ghost" onClick={() => setLines((current) => current.length > 1 ? current.filter((x) => x.id !== line.id) : current)}>×</button></div>)}</div>
              <button className="add-line" onClick={() => setLines((current) => [...current, blankLine()])}>+　添加明细行</button>
              <label>条款与备注<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
              <div className="composer-actions"><button className="secondary" onClick={() => saveDocument("Draft")}>保存草稿</button><button className="secondary" onClick={() => window.print()}>打印 / PDF</button><button className="primary" onClick={() => saveDocument("Confirmed")}>确认单据</button></div>
            </section>
            <DocumentPreview type={docType} number={docNumber} date={docDate} customer={selectedCustomer} currency={currency} lines={lines} notes={notes} total={total} />
            <section className="panel no-print history-panel"><div className="panel-head"><div><p className="eyebrow">SAVED RECORDS</p><h3>已保存单据</h3></div></div>{store.documents.length ? <div className="document-history">{store.documents.map((doc) => <article key={doc.id}><span className="doc-badge">{docShort[doc.type]}</span><div><b>{doc.number}</b><small>{doc.type} · {store.customers.find((x) => x.id === doc.customerId)?.company}</small></div><b>{money(doc.items.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0), doc.currency)}</b><span className={`tag ${doc.status === "Confirmed" ? "confirmed" : ""}`}>{doc.status === "Confirmed" ? "已确认" : "草稿"}</span><button className="danger-ghost" onClick={() => setStore((s) => ({ ...s, documents: s.documents.filter((x) => x.id !== doc.id) }))}>×</button></article>)}</div> : <div className="empty-state compact"><p>暂无已保存单据</p></div>}</section>
          </div>
        )}

        {view === "backup" && (
          <div className="page backup-page"><section className="backup-hero panel"><div className="backup-art"><span>⇅</span></div><div><p className="eyebrow">YOUR DATA, YOUR CONTROL</p><h2>把业务资料握在自己手里。</h2><p>MyTM Docs 使用浏览器本地存储。建议定期导出 JSON 完整备份，特别是在更换电脑或清理浏览器之前。</p><div className="backup-actions"><button className="primary" onClick={exportBackup}>导出完整备份</button><label className="secondary file-button">恢复备份<input type="file" accept="application/json" onChange={importBackup} /></label></div></div></section><section className="backup-grid"><article className="panel"><span>01</span><h3>离线优先</h3><p>客户、商品和单据不会主动上传至外部服务。</p></article><article className="panel"><span>02</span><h3>可迁移</h3><p>一个 JSON 文件包含当前所有业务记录。</p></article><article className="panel"><span>03</span><h3>易恢复</h3><p>选择之前的备份文件，即可恢复整个工作台。</p></article></section></div>
        )}
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function DocumentPreview({ type, number, date, customer, currency, lines, notes, total }: { type: DocType; number: string; date: string; customer?: Customer; currency: string; lines: LineItem[]; notes: string; total: number }) {
  return <section className="document-preview" id="print-document"><div className="doc-brand"><img src="/mytm-logo.png" alt="MyTM Docs" /><div><b>MyTM Docs</b><span>Trade documents, made clear.</span></div></div><div className="doc-title"><p>{type.toUpperCase()}</p><h2>{type}</h2></div><div className="doc-meta"><div><small>DOCUMENT NO.</small><b>{number}</b></div><div><small>ISSUE DATE</small><b>{date}</b></div><div><small>CURRENCY</small><b>{currency}</b></div></div><div className="party"><div><small>ISSUED BY</small><b>MyTM</b><p>Tel: 18152098328</p></div><div><small>ISSUED TO</small><b>{customer?.company || "Select a customer"}</b><p>{customer?.contact}<br />{customer?.address}<br />{customer?.email}</p></div></div><table><thead><tr><th>#</th><th>DESCRIPTION</th><th>QTY</th><th>UNIT</th><th>UNIT PRICE</th><th>AMOUNT</th></tr></thead><tbody>{lines.filter((x) => x.description).map((line, index) => <tr key={line.id}><td>{index + 1}</td><td>{line.description}</td><td>{line.quantity}</td><td>{line.unit}</td><td>{money(line.unitPrice, currency)}</td><td>{money(line.quantity * line.unitPrice, currency)}</td></tr>)}{!lines.some((x) => x.description) && <tr><td colSpan={6} className="preview-placeholder">添加商品后在此预览</td></tr>}</tbody></table><div className="doc-total"><span>GRAND TOTAL</span><b>{money(total, currency)}</b></div><div className="doc-notes"><small>TERMS & NOTES</small><p>{notes || "—"}</p></div><div className="signature"><span>Authorized signature</span><span>Company stamp</span></div><footer><span>MyTM Docs · Local Trade Desk</span><span>18152098328</span></footer></section>;
}
