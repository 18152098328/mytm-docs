import type { Store } from "./types";

export type Me = { id: number; email: string; role: string };

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  disabled: boolean;
  created_at: string;
  last_sync: string | null;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch {
    throw new Error("网络不可用，无法连接云端服务");
  }
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(body?.error || "请求失败 (" + res.status + ")");
  return body as T;
}

export const fetchMe = () => call<{ me: Me | null }>("/api/auth/").then((r) => r.me);

export const cloudLogin = (email: string, password: string) =>
  call<{ me: Me }>("/api/auth/", {
    method: "POST",
    body: JSON.stringify({ action: "login", email, password }),
  }).then((r) => r.me);

export const cloudLogout = () =>
  call<{ ok: boolean }>("/api/auth/", {
    method: "POST",
    body: JSON.stringify({ action: "logout" }),
  });

export const getCloudStore = () =>
  call<{ data: unknown; updatedAt?: string }>("/api/store/");

export const putCloudStore = (store: Store) =>
  call<{ updatedAt: string }>("/api/store/", {
    method: "PUT",
    body: JSON.stringify({ data: store }),
  });

export const adminListUsers = () => call<{ users: AdminUser[] }>("/api/admin/").then((r) => r.users);

export const adminCreateUser = (email: string, password: string, role: string) =>
  call<{ ok: boolean }>("/api/admin/", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });

export const adminUpdateUser = (
  id: number,
  patch: { disabled?: boolean; newPassword?: string; role?: string },
) =>
  call<{ ok: boolean }>("/api/admin/", {
    method: "PATCH",
    body: JSON.stringify({ id, ...patch }),
  });
