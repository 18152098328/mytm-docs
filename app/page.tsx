"use client";

import { ChangeEvent, useEffect, useState } from "react";
import type {
  Customer,
  DocStatus,
  DocType,
  Draft,
  Product,
  Seller,
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
import {
  cloudLogin,
  cloudLogout,
  cloudRegister,
  fetchMe,
  getCloudStore,
  putCloudStore,
  type Me,
} from "./lib/cloud";
import { Icon } from "./components/icons";
import { Sidebar, viewLabels } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { CustomersView } from "./components/CustomersView";
import { ProductsView } from "./components/ProductsView";
import { DocumentsView } from "./components/DocumentsView";
import { SettingsView } from "./components/SettingsView";
import { AccountView, type CloudStatus } from "./components/AccountView";
import { BackupView } from "./components/BackupView";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [store, setStore] = useState<Store>(starter);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraftState] = useState<Draft>(() => makeDraft("Quotation", []));
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [me, setMe] = useState<Me | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("off");

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
    try {
      if (localStorage.getItem("mytm-docs-theme") === "dark") setTheme("dark");
    } catch {
      /* default light */
    }
    setLoaded(true);
    // Restore a cloud session if one exists; pull the cloud workspace silently.
    fetchMe()
      .then(async (m) => {
        if (!m) return;
        setMe(m);
        try {
          const remote = await getCloudStore();
          if (remote.data) {
            const parsed = parseBackup(JSON.stringify(remote.data));
            if (parsed) setStore(parsed);
          }
          setCloudStatus("synced");
        } catch {
          setCloudStatus("error");
        }
      })
      .catch(() => {
        /* cloud service unavailable; stay local */
      });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("mytm-docs-theme", theme);
    } catch {
      /* non-persistent */
    }
  }, [theme]);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, loaded]);

  useEffect(() => {
    if (!me || !loaded) return;
    const timer = setTimeout(() => {
      setCloudStatus("syncing");
      putCloudStore(store)
        .then(() => setCloudStatus("synced"))
        .catch(() => setCloudStatus("error"));
    }, 2500);
    return () => clearTimeout(timer);
  }, [store, me, loaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---------- cloud account ---------- */

  async function afterAuth(user: Me) {
    setMe(user);
    const remote = await getCloudStore().catch(() => null);
    if (remote?.data) {
      const useCloud = window.confirm(
        "云端账号里已有数据。\n确定 = 加载云端数据（覆盖本设备）\n取消 = 以本设备数据覆盖云端",
      );
      if (useCloud) {
        const parsed = parseBackup(JSON.stringify(remote.data));
        if (parsed) setStore(parsed);
        setCloudStatus("synced");
        setToast("已加载云端数据");
        return;
      }
    }
    await putCloudStore(store).catch(() => undefined);
    setCloudStatus("synced");
    setToast("云同步已开启");
  }

  async function loginCloud(email: string, password: string) {
    await afterAuth(await cloudLogin(email, password));
  }

  async function registerCloud(email: string, password: string) {
    const user = await cloudRegister(email, password);
    setMe(user);
    await putCloudStore(store).catch(() => undefined);
    setCloudStatus("synced");
    setToast(user.role === "admin" ? "注册成功，你是管理员" : "注册成功，云同步已开启");
  }

  async function logoutCloud() {
    await cloudLogout().catch(() => undefined);
    setMe(null);
    setCloudStatus("off");
    setToast("已退出登录，数据保留在本设备");
  }

  async function syncNow() {
    if (!me) return;
    setCloudStatus("syncing");
    try {
      await putCloudStore(store);
      setCloudStatus("synced");
      setToast("已同步到云端");
    } catch (e) {
      setCloudStatus("error");
      setToast(e instanceof Error ? e.message : "同步失败");
    }
  }

  /* ---------- seller ---------- */

  function saveSeller(seller: Seller) {
    setStore((s) => ({ ...s, seller }));
    setToast("公司信息已保存");
  }

  /** Persist the stamp position after it is dragged on the preview. */
  function moveStamp(x: number, y: number) {
    setStore((s) => ({ ...s, seller: { ...s.seller, stampX: x, stampY: y } }));
    setToast("印章位置已保存");
  }

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
      language: draft.language,
      items: cleanLines,
      moq: draft.moq,
      paymentTerms: draft.paymentTerms,
      notes: draft.notes,
      incoterm: draft.incoterm,
      portOfLoading: draft.portOfLoading,
      portOfDestination: draft.portOfDestination,
      shippingMarks: draft.shippingMarks,
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

  /** Unsaved composer content that would be lost by starting over. */
  function hasUnsavedWork() {
    return !draft.id && draft.lines.some((x) => x.description.trim());
  }

  function newDocument(type?: DocType) {
    if (hasUnsavedWork() && !window.confirm("当前编辑器中有未保存的单据内容，确定放弃并新建？")) {
      setView("documents");
      return;
    }
    setDraftState((d) => makeDraft(type ?? d.type, store.documents));
    setView("documents");
    if (type) setToast("已新建" + docNames[type] + "草稿");
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

  /** Convert the currently open saved document into a new draft of another type. */
  function convertDocument(type: DocType) {
    setDraftState((d) => ({
      ...d,
      id: null,
      type,
      number: makeNumber(type, store.documents),
      date: today,
    }));
    setToast("已由原单据生成" + docNames[type] + "新草稿，请检查后保存");
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
      if (!data) {
        setToast("备份文件无法识别");
        return;
      }
      if (!window.confirm("恢复备份将覆盖当前全部数据，确定继续？")) return;
      setStore(data);
      setToast("备份已恢复");
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
            {store.seller.tel && <span className="phone">TEL&nbsp; {store.seller.tel}</span>}
            <button
              className="icon-button theme-toggle"
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
              title={theme === "light" ? "深色模式" : "浅色模式"}
            >
              <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
            </button>
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
            onConvert={convertDocument}
            onStampMove={moveStamp}
          />
        )}

        {view === "settings" && <SettingsView seller={store.seller} onSave={saveSeller} />}

        {view === "account" && (
          <AccountView
            me={me}
            cloudStatus={cloudStatus}
            onLogin={loginCloud}
            onRegister={registerCloud}
            onLogout={logoutCloud}
            onSyncNow={syncNow}
          />
        )}

        {view === "backup" && <BackupView onExport={exportBackup} onImport={importBackup} />}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
