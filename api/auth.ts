import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  HttpError,
  db,
  ensureSchema,
  handleError,
  hashPassword,
  readTokenUserId,
  send,
  setAuthCookie,
  signToken,
  verifyPassword,
} from "./_shared.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = db();
    await ensureSchema(sql);

    if (req.method === "GET") {
      const uid = readTokenUserId(req);
      if (!uid) {
        send(res, 200, { me: null });
        return;
      }
      const rows = (await sql`SELECT id, email, role, disabled FROM users WHERE id = ${uid}`) as {
        id: number;
        email: string;
        role: string;
        disabled: boolean;
      }[];
      if (!rows.length || rows[0].disabled) {
        setAuthCookie(res, null);
        send(res, 200, { me: null });
        return;
      }
      send(res, 200, { me: { id: rows[0].id, email: rows[0].email, role: rows[0].role } });
      return;
    }

    if (req.method !== "POST") throw new HttpError(405, "不支持的请求方法");
    const body = (req.body ?? {}) as { action?: string; email?: string; password?: string };
    const action = String(body.action || "");

    if (action === "logout") {
      setAuthCookie(res, null);
      send(res, 200, { ok: true });
      return;
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "邮箱格式不正确");

    if (action === "register") {
      if (password.length < 6) throw new HttpError(400, "密码至少 6 位");
      const countRows = (await sql`SELECT count(*)::int AS n FROM users`) as { n: number }[];
      // Public registration is closed once the first (admin) account exists;
      // accounts are created and assigned by the administrator.
      if (countRows[0].n > 0) throw new HttpError(403, "注册已关闭，账号由管理员统一分配");
      const role = "admin";
      const rows = (await sql`
        INSERT INTO users (email, password_hash, role)
        VALUES (${email}, ${hashPassword(password)}, ${role})
        RETURNING id, email, role
      `) as { id: number; email: string; role: string }[];
      setAuthCookie(res, signToken(rows[0].id));
      send(res, 200, { me: rows[0] });
      return;
    }

    if (action === "login") {
      const rows = (await sql`
        SELECT id, email, role, disabled, password_hash FROM users WHERE email = ${email}
      `) as { id: number; email: string; role: string; disabled: boolean; password_hash: string }[];
      if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
        throw new HttpError(401, "邮箱或密码错误");
      }
      if (rows[0].disabled) throw new HttpError(403, "账号已被停用，请联系管理员");
      setAuthCookie(res, signToken(rows[0].id));
      send(res, 200, { me: { id: rows[0].id, email: rows[0].email, role: rows[0].role } });
      return;
    }

    throw new HttpError(400, "未知操作");
  } catch (error) {
    handleError(res, error);
  }
}
