import type { Me } from "../lib/cloud";
import { Icon } from "./icons";

export type CloudStatus = "off" | "syncing" | "synced" | "error";

export function AccountView({
  me,
  cloudStatus,
  onLogout,
  onSyncNow,
}: {
  me: Me | null;
  cloudStatus: CloudStatus;
  onLogout: () => Promise<void>;
  onSyncNow: () => Promise<void>;
}) {
  const statusText: Record<CloudStatus, string> = {
    off: "未开启",
    syncing: "同步中…",
    synced: "已同步",
    error: "同步失败，稍后会自动重试",
  };

  return (
    <div className="page settings-page">
      <section className="panel form-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">CLOUD ACCOUNT</p>
            <h3>云端账号</h3>
          </div>
        </div>

        {me ? (
          <>
            <div className="account-status">
              <div className="account-avatar">{me.email.slice(0, 1).toUpperCase()}</div>
              <div>
                <b>{me.email}</b>
                <small>
                  {me.role === "admin" ? "管理员" : "普通用户"} · 云同步：{statusText[cloudStatus]}
                </small>
              </div>
            </div>
            <p className="section-hint">
              客户、商品、单据与公司设置会自动同步到云端。换设备登录同一账号即可看到同一套数据。
            </p>
            <div className="composer-actions">
              <button className="secondary" onClick={() => void onSyncNow()}>
                <Icon name="convert" size={15} />
                立即同步
              </button>
              {me.role === "admin" && (
                <a className="secondary account-admin-link" href="/admin/">
                  <Icon name="settings" size={15} />
                  账户管理后台
                </a>
              )}
              <button className="primary" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </>
        ) : (
          <p className="section-hint">当前为本地模式（云端服务不可用），数据仅保存在此设备。</p>
        )}
      </section>

      <section className="panel settings-preview">
        <div className="panel-head">
          <div>
            <p className="eyebrow">HOW IT WORKS</p>
            <h3>云同步说明</h3>
          </div>
        </div>
        <div className="settings-tips">
          <p>规则</p>
          <ul>
            <li>所有人必须登录后才能使用工作台，账号由管理员在后台创建分配。</li>
            <li>每个账号的数据独立，互不可见；多设备登录同一账号即共享同一套数据。</li>
            <li>每次修改会在几秒内自动上传，本页可看同步状态。</li>
            <li>退出登录会清除本设备缓存，数据安全留在云端。</li>
            <li>备份导出、恢复功能仍可用于手动存档。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
