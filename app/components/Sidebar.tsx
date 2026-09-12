import type { View } from "../lib/types";
import { Icon, type IconName } from "./icons";

const nav: { id: View; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "工作台", icon: "dashboard" },
  { id: "customers", label: "客户资料", icon: "customers" },
  { id: "products", label: "商品资料", icon: "products" },
  { id: "documents", label: "外贸单据", icon: "documents" },
  { id: "settings", label: "公司设置", icon: "settings" },
  { id: "backup", label: "备份恢复", icon: "backup" },
];

export const viewLabels: Record<View, string> = {
  dashboard: "工作台",
  customers: "客户资料",
  products: "商品资料",
  documents: "外贸单据",
  settings: "公司设置",
  backup: "备份恢复",
};

export function Sidebar({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <aside className="sidebar no-print">
      <button className="brand" onClick={() => onNavigate("dashboard")} aria-label="MyTM Docs 首页">
        <img src="/mytm-logo.png" alt="MyTM Docs" />
        <span>
          <b>MyTM Docs</b>
          <small>LOCAL TRADE DESK</small>
        </span>
      </button>
      <nav>
        {nav.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="status-dot" />
        <div>
          <b>本地模式</b>
          <small>数据仅保存在此设备</small>
        </div>
      </div>
    </aside>
  );
}
