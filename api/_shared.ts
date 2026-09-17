import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Sql = ReturnType<typeof neon>;

export function db(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new HttpError(503, "云端服务未配置：请在 Vercel 项目中连接 Neon Postgres 数据库");
  return neon(url);
}

let schemaReady = false;

export async function ensureSchema(sql: Sql) {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    disabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS stores (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  schemaReady = true;
}

/* ---------- passwords ---------- */

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `s1$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  const hash = crypto.scryptSync(password, parts[1], 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(parts[2]));
}

/* ---------- session tokens ---------- */

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new HttpError(503, "云端服务未配置：请在 Vercel 项目中设置 AUTH_SECRET 环境变量");
  return s;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

function hmac(input: string) {
  return crypto.createHmac("sha256", secret()).update(input).digest("base64url");
}

export function signToken(userId: number, days = 30) {
  const payload = b64url(
    Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + days * 86400_000 })),
  );
  return payload + "." + hmac(payload);
}

export function verifyToken(token: string): number | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.uid !== "number" || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}

/* ---------- request helpers ---------- */

const COOKIE = "mytm_token";

export function readTokenUserId(req: VercelRequest): number | null {
  const cookie = req.headers.cookie || "";
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!match) return null;
  return verifyToken(decodeURIComponent(match.slice(COOKIE.length + 1)));
}

export function setAuthCookie(res: VercelResponse, token: string | null) {
  const base = `${COOKIE}=${token ? encodeURIComponent(token) : ""}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  res.setHeader("Set-Cookie", token ? `${base}; Max-Age=${30 * 86400}` : `${base}; Max-Age=0`);
}

export type UserRow = {
  id: number;
  email: string;
  role: string;
  disabled: boolean;
  created_at: string;
};

export async function requireUser(sql: Sql, req: VercelRequest): Promise<UserRow> {
  const uid = readTokenUserId(req);
  if (!uid) throw new HttpError(401, "未登录");
  const rows = (await sql`SELECT id, email, role, disabled, created_at FROM users WHERE id = ${uid}`) as UserRow[];
  if (!rows.length) throw new HttpError(401, "账号不存在");
  if (rows[0].disabled) throw new HttpError(403, "账号已被停用");
  return rows[0];
}

export function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

export function handleError(res: VercelResponse, error: unknown) {
  if (error instanceof HttpError) {
    send(res, error.status, { error: error.message });
    return;
  }
  console.error(error);
  send(res, 500, { error: "服务器内部错误" });
}
