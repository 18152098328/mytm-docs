import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HttpError, db, ensureSchema, handleError, requireUser, send } from "./_shared.js";

/** Cloud copy of one user's workspace. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = db();
    await ensureSchema(sql);
    const user = await requireUser(sql, req);

    if (req.method === "GET") {
      const rows = (await sql`
        SELECT data, updated_at FROM stores WHERE user_id = ${user.id}
      `) as { data: unknown; updated_at: string }[];
      send(res, 200, rows.length ? { data: rows[0].data, updatedAt: rows[0].updated_at } : { data: null });
      return;
    }

    if (req.method === "PUT") {
      const body = (req.body ?? {}) as { data?: unknown };
      const data = body.data;
      if (!data || typeof data !== "object") throw new HttpError(400, "数据格式不正确");
      const raw = JSON.stringify(data);
      if (raw.length > 4_000_000) throw new HttpError(413, "数据超过 4MB，请精简商品图片后重试");
      const rows = (await sql`
        INSERT INTO stores (user_id, data, updated_at)
        VALUES (${user.id}, ${raw}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE SET data = ${raw}::jsonb, updated_at = now()
        RETURNING updated_at
      `) as { updated_at: string }[];
      send(res, 200, { updatedAt: rows[0].updated_at });
      return;
    }

    throw new HttpError(405, "不支持的请求方法");
  } catch (error) {
    handleError(res, error);
  }
}
