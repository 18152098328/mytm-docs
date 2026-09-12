"use client";

import { ChangeEvent, useEffect, useState } from "react";
import type {
  Customer,
  DocStatus,
  DocType,
  Draft,
  Product,
  Store,
  TradeDocument,
  View,
} from "./lib/types";
import {
  STORAGE_KEY,
  docNames,
  draftFromDocument,
  makeDraft,
  makeNumber,
  parseBackup,
  starter,
  today,
  uid,
} from "./lib/data";
import { Sidebar, viewLabels } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { CustomersView } from "./components/CustomersView";
import { ProductsView } from "./components/ProductsView";
import { DocumentsView } from "./components/DocumentsView";
import { BackupView } from "./components/BackupView";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [store, setStore] = useState<Store>(starter);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraftState] = useState<Draft>(() => makeDraft("Quotation", []));

  const setDraft = (updater: (d: Draft) => Draft) => setDraftState(updater);

  useEffect(() => {
    // Hydration-safe one-time load from localStorage: the saved workspace can
    // only be read on the client, after the first render.
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseBackup(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store on mount
        if (parsed) setStore(parsed);
      }
    } catch {
      /* keep starter data */
    }
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

  /* ---------- customers ---------- */

  function saveCustomer(item: Customer) {
    const exists = store.customers.some((x) => x.id === item.id);
    setStore((s) => ({
      ...s,
      customers: exists
        ? s.customers.map((x) => (x.id === item.id ? item : x))
        : [item, ...s.customers],
    }));
    if (!exists) setDraftState((d) => (d.customerId ? d : { ...d, customerId: item.id }));
    setToast(exists ? "客户已更新" : "客户已保存");
  }

  function deleteCustomer(id: string) {
    setStore((s) => ({ ...s, customers: s.customers.filter((x) => x.id !== id) }));
    setDraftState((d) => (d.customerId === id ? { ...d, customerId: "" } : d));
    setToast("客户已删除");
  }

  /* ---------- products ---------- */

  function saveProduct(item: Product) {
    const exists = store.products.some((x) => x.id === item.id);
    setStore((s) => ({
      ...s,
      products: exists
        ? s.products.map((x) => (x.id === item.id ? item : x))
        : [item, ...s.products],
    }));
    setToast(exists ? "商品已更新" : "商品已保存");
  }

  function deleteProduct(id: string) {
    setStore((s) => ({ ...s, products: s.products.filter((x) => x.id !== id) }));
    setToast("商品已删除");
  }

  /* ---------- documents ---------- */

  function saveDocument(status: DocStatus) {
    const cleanLines = draft.lines.filter((x) => x.description.trim());
    if (!draft.customerId || !cleanLines.length) {
      setToast("请选择客户并添加至少一项商品");
      return;
    }
    const id = draft.id ?? uid();
    const existing = store.documents.find((x) => x.id === id);
    const doc: TradeDocument = {
      id,
      type: draft.type,
      number: draft.number.trim() || makeNumber(draft.type, store.documents),
      date: draft.date || today,
      customerId: draft.customerId,
      currency: draft.currency,
      status,
      items: cleanLines,
      notes: draft.notes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    setStore((s) => ({
      ...s,
      documents: existing
        ? s.documents.map((x) => (x.id === id ? doc : x))
        : [doc, ...s.documents],
    }));
    setDraftState((d) => ({ ...d, id, number: doc.number }));
    setToast(existing ? "单据已更新" : status === "Confirmed" ? "单据已确认" : "草稿已保存");
  }

  function newDocument(type?: DocType) {
    setDraftState((d) => makeDraft(type ?? d.type, store.documents));
    setView("documents");
    if (type) setToast("已切换到" + docNames[type]);
  }

  function editDocument(doc: TradeDocument) {
    setDraftState(draftFromDocument(doc));
    setView("documents");
  }

  function deleteDocument(id: string) {
    setStore((s) => ({ ...s, documents: s.documents.filter((x) => x.id !== id) }));
    setDraftState((d) => (d.id === id ? { ...d, id: null } : d));
    setToast("单据已删除");
  }

  /* ---------- backup ---------- */

  function exportBackup() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MyTM-Docs-backup-" + today + ".json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("备份已导出");
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = parseBackup(String(reader.result));
      if (data) {
        setStore(data);
        setToast("备份已恢复");
      } else {
        setToast("备份文件无法识别");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="app-shell">
      <Sidebar view={view} onNavigate={setView} />

      <section className="workspace">
        <header className="topbar no-print">
          <div>
            <p className="eyebrow">MYTM BUSINESS OPERATIONS</p>
            <h1>{viewLabels[view]}</h1>
          </div>
          <div className="top-actions">
            <span className="phone">TEL&nbsp; 18152098328</span>
            <button className="primary" onClick={() => newDocument()}>
              + 新建单据
            </button>
          </div>
        </header>

        {view === "dashboard" && (
          <DashboardView
            store={store}
            onNewDocument={newDocument}
            onEditDocument={editDocument}
            onShowDocuments={() => setView("documents")}
          />
        )}

        {view === "customers" && (
          <CustomersView customers={store.customers} onSave={saveCustomer} onDelete={deleteCustomer} />
        )}

        {view === "products" && (
          <ProductsView products={store.products} onSave={saveProduct} onDelete={deleteProduct} />
        )}

        {view === "documents" && (
          <DocumentsView
            store={store}
            draft={draft}
            setDraft={setDraft}
            onSave={saveDocument}
            onNew={() => newDocument()}
            onEdit={editDocument}
            onDelete={deleteDocument}
          />
        )}

        {view === "backup" && <BackupView onExport={exportBackup} onImport={importBackup} />}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
