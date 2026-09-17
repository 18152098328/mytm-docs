import { FormEvent, useState } from "react";

/** Full-screen sign-in required before the workspace opens. */
export function LoginGate({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onLogin(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
      setBusy(false);
    }
  }

  return (
    <div className="login-gate">
      <div className="login-card">
        <div className="login-brand">
          <img src="/mytm-logo.png" alt="MyTM Docs" />
          <div>
            <b>MyTM Docs</b>
            <small>TRADE DOCUMENT WORKSPACE</small>
          </div>
        </div>
        <h2>登录工作台</h2>
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
              autoFocus
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
          {error && <p className="form-error">{error}</p>}
          <button className="primary wide" disabled={busy}>
            {busy ? "登录中…" : "登录"}
          </button>
        </form>
        <p className="login-note">账号由管理员统一创建与分配，如需开通请联系管理员。</p>
      </div>
    </div>
  );
}
