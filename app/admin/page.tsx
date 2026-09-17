"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminListUsers, adminUpdateUser, fetchMe, type AdminUser, type Me } from "../lib/cloud";
import { Icon } from "../components/icons";

export default function AdminPage() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

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
        setError(e instanceof Error ? e.message : "加载失败");
      });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  async function act(id: number, patch: { disabled?: boolean; newPassword?: string; role?: string }, msg: string) {
    try {
      await adminUpdateUser(id, patch);
      await reload();
      setToast(msg);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "操作失败");
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
        <div className="panel admin-panel">
          <p>{error || "请先在工作台的「账号同步」页登录管理员账号，再打开本页。"}</p>
        </div>
      )}

      {me && me.role !== "admin" && (
        <div className="panel admin-panel">
          <p>当前账号（{me.email}）不是管理员，无法访问账户管理后台。</p>
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
                  {u.id !== me.id && u.role !== "admin" && (
                    <button className="text-button" onClick={() => void act(u.id, { role: "admin" }, "已设为管理员")}>
                      设为管理员
                    </button>
                  )}
                </span>
              </div>
            ))}
            {!users.length && <div className="empty-state compact"><p>暂无账号</p></div>}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
