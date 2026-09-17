import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  HttpError,
  db,
  ensureSchema,
  handleError,
  hashPassword,
  requireUser,
  send,
} from "./_shared.js";

/** Simple account administration: list users, enable/disable, reset password. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = db();
    await ensureSchema(sql);
    const user = await requireUser(sql, req);
    if (user.role !== "admin") throw new HttpError(403, "仅管理员可访问");

    if (req.method === "GET") {
      const rows = await sql`
        SELECT u.id, u.email, u.role, u.disabled, u.created_at, s.updated_at AS last_sync
        FROM users u LEFT JOIN stores s ON s.user_id = u.id
        ORDER BY u.id
      `;
      send(res, 200, { users: rows });
      return;
    }

    if (req.method === "POST") {
      const body = (req.body ?? {}) as { email?: string; password?: string; role?: string };
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "邮箱格式不正确");
      if (password.length < 6) throw new HttpError(400, "初始密码至少 6 位");
      const existing = (await sql`SELECT id FROM users WHERE email = ${email}`) as { id: number }[];
      if (existing.length) throw new HttpError(409, "该邮箱已存在");
      const role = body.role === "admin" ? "admin" : "user";
      await sql`INSERT INTO users (email, password_hash, role) VALUES (${email}, ${hashPassword(password)}, ${role})`;
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as {
        id?: number;
        disabled?: boolean;
        newPassword?: string;
        role?: string;
      };
      const id = Number(body.id);
      if (!Number.isInteger(id)) throw new HttpError(400, "缺少用户 id");

      if (typeof body.disabled === "boolean") {
        if (id === user.id) throw new HttpError(400, "不能停用自己的账号");
        await sql`UPDATE users SET disabled = ${body.disabled} WHERE id = ${id}`;
      }
      if (typeof body.newPassword === "string") {
        if (body.newPassword.length < 6) throw new HttpError(400, "密码至少 6 位");
        await sql`UPDATE users SET password_hash = ${hashPassword(body.newPassword)} WHERE id = ${id}`;
      }
      if (body.role === "admin" || body.role === "user") {
        if (id === user.id) throw new HttpError(400, "不能修改自己的角色");
        await sql`UPDATE users SET role = ${body.role} WHERE id = ${id}`;
      }
      send(res, 200, { ok: true });
      return;
    }

    throw new HttpError(405, "不支持的请求方法");
  } catch (error) {
    handleError(res, error);
  }
}
