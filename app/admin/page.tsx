"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminCreateUser,
  adminListUsers,
  adminUpdateUser,
  cloudLogin,
  cloudLogout,
  fetchMe,
  type AdminUser,
  type Me,
} from "../lib/cloud";
import { Icon } from "../components/icons";

export default function AdminPage() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [toast, setToast] = useState("");

  // sign-in form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  // create-account form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [creating, setCreating] = useState(false);

  async function reload() {
    setUsers(await adminListUsers());
  }

  useEffect(() => {
    document.title = "账户管理 | MyTM Docs";
    fetchMe()
      .then(async (m) => {
        setMe(m);
        if (m?.role === "admin") await reload();
      })
      .catch((e) => {
        setMe(null);
        setLoginError(e instanceof Error ? e.message : "云端服务不可用");
      });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      const m = await cloudLogin(email.trim(), password);
      setMe(m);
      setPassword("");
      if (m.role === "admin") await reload();
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await cloudLogout().catch(() => undefined);
    setMe(null);
    setUsers([]);
  }

  async function act(
    id: number,
    patch: { disabled?: boolean; newPassword?: string; role?: string },
    msg: string,
  ) {
    try {
      await adminUpdateUser(id, patch);
      await reload();
      setToast(msg);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function createAccount() {
    if (!newEmail.trim() || newPassword.length < 6) {
      setToast("请填写邮箱和至少 6 位的初始密码");
      return;
    }
    setCreating(true);
    try {
      await adminCreateUser(newEmail.trim(), newPassword, newRole);
      await reload();
      setToast("账号已创建，请把邮箱和初始密码告知使用者");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  function resetPassword(user: AdminUser) {
    const pw = window.prompt("为 " + user.email + " 设置新密码（至少 6 位）：");
    if (!pw) return;
    void act(user.id, { newPassword: pw }, "密码已重置");
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">MYTM DOCS</p>
          <h1>账户管理后台</h1>
        </div>
        <Link className="secondary admin-back" href="/">
          <Icon name="arrow-right" size={15} />
          返回工作台
        </Link>
      </header>

      {me === undefined && <div className="panel admin-panel">正在加载…</div>}

      {me === null && (
        <div className="panel admin-panel admin-login">
          <div className="panel-head">
            <div>
              <p className="eyebrow">ADMIN SIGN IN</p>
              <h3>管理员登录</h3>
            </div>
          </div>
          <form onSubmit={login}>
            <label>
              邮箱
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              密码
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {loginError && <p className="form-error">{loginError}</p>}
            <button className="primary wide" disabled={busy}>
              {busy ? "登录中…" : "登录后台"}
            </button>
          </form>
          <p className="section-hint">仅管理员账号可以进入账户管理后台。</p>
        </div>
      )}

      {me && me.role !== "admin" && (
        <div className="panel admin-panel">
          <p>当前账号（{me.email}）是普通用户，无权访问账户管理后台。</p>
          <div className="composer-actions">
            <button className="secondary" onClick={() => void logout()}>
              退出登录，更换账号
            </button>
          </div>
        </div>
      )}

      {me?.role === "admin" && (
        <div className="panel admin-panel admin-create">
          <div className="panel-head">
            <div>
              <p className="eyebrow">NEW ACCOUNT</p>
              <h3>创建账号</h3>
            </div>
            <span className="admin-me">
              {me.email} ·
              <button className="text-button" onClick={() => void logout()}>
                退出登录
              </button>
            </span>
          </div>
          <div className="admin-create-row">
            <input
              type="email"
              placeholder="邮箱，如 staff@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="初始密码（至少 6 位）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
            <button className="primary" disabled={creating} onClick={() => void createAccount()}>
              {creating ? "创建中…" : "创建账号"}
            </button>
          </div>
          <p className="section-hint">
            创建后把邮箱与初始密码告知使用者，需要时可在下方随时重置密码。
          </p>
        </div>
      )}

      {me?.role === "admin" && (
        <div className="panel admin-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">{users.length} ACCOUNTS</p>
              <h3>全部账号</h3>
            </div>
            <button className="text-button" onClick={() => void reload()}>
              刷新
            </button>
          </div>
          <div className="admin-table">
            <div className="admin-head">
              <span>邮箱</span>
              <span>角色</span>
              <span>状态</span>
              <span>注册时间</span>
              <span>最近同步</span>
              <span>操作</span>
            </div>
            {users.map((u) => (
              <div className="admin-row" key={u.id}>
                <span className="admin-email">{u.email}</span>
                <span>
                  <span className={"tag" + (u.role === "admin" ? " confirmed" : "")}>
                    {u.role === "admin" ? "管理员" : "用户"}
                  </span>
                </span>
                <span>
                  <span className={"tag" + (u.disabled ? "" : " confirmed")}>
                    {u.disabled ? "已停用" : "正常"}
                  </span>
                </span>
                <span className="admin-dim">{u.created_at?.slice(0, 10)}</span>
                <span className="admin-dim">
                  {u.last_sync ? u.last_sync.slice(0, 16).replace("T", " ") : "—"}
                </span>
                <span className="row-actions">
                  <button className="text-button" onClick={() => resetPassword(u)}>
                    重置密码
                  </button>
                  {u.id !== me.id && (
                    <button
                      className="text-button"
                      onClick={() =>
                        void act(u.id, { disabled: !u.disabled }, u.disabled ? "账号已启用" : "账号已停用")
                      }
                    >
                      {u.disabled ? "启用" : "停用"}
                    </button>
                  )}
                  {u.id !== me.id &&
                    (u.role === "admin" ? (
                      <button
                        className="text-button"
                        onClick={() => void act(u.id, { role: "user" }, "已取消管理员权限")}
                      >
                        取消管理员
                      </button>
                    ) : (
                      <button
                        className="text-button"
                        onClick={() => void act(u.id, { role: "admin" }, "已设为管理员")}
                      >
                        设为管理员
                      </button>
                    ))}
                </span>
              </div>
            ))}
            {!users.length && (
              <div className="empty-state compact">
                <p>暂无账号</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
