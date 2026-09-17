import { FormEvent, useState } from "react";
import type { Me } from "../lib/cloud";
import { Icon } from "./icons";

export type CloudStatus = "off" | "syncing" | "synced" | "error";

export function AccountView({
  me,
  cloudStatus,
  onLogin,
  onRegister,
  onLogout,
  onSyncNow,
}: {
  me: Me | null;
  cloudStatus: CloudStatus;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onSyncNow: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await onLogin(email.trim(), password);
      else await onRegister(email.trim(), password);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

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
            <h3>{me ? "云端账号" : mode === "login" ? "登录" : "注册新账号"}</h3>
          </div>
          {!me && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "没有账号？注册" : "已有账号？登录"}
            </button>
          )}
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
              客户、商品、单据与公司设置会自动同步到云端。换设备或换浏览器后，登录同一账号即可看到同一套数据。
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
          <form onSubmit={submit}>
            <label>
              邮箱
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              密码
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "至少 6 位" : ""}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary wide" disabled={busy}>
              {busy ? "请稍候…" : mode === "login" ? "登录" : "注册并开启同步"}
            </button>
          </form>
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
            <li>不登录时一切照旧：数据只保存在当前浏览器，完全本地。</li>
            <li>登录后数据自动同步到云端，多设备登录同一账号即共享同一套数据。</li>
            <li>首次登录时若云端已有数据，会询问以云端还是本地为准。</li>
            <li>之后每次修改会在几秒内自动上传，右侧栏会显示同步状态。</li>
            <li>第一个注册的账号自动成为管理员，可打开账户管理后台。</li>
            <li>备份导出、恢复功能不受影响，仍可随时手动存档。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
