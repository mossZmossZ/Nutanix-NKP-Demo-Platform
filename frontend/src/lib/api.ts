export type Role = "admin" | "user";

export interface User {
  id: string;
  username: string;
  role: Role;
  createdAt?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper. Same-origin in dev (Vite proxy) and prod (nginx), so the
 * httpOnly auth cookie rides along automatically — `credentials: "include"` is
 * belt-and-suspenders. Throws ApiError on non-2xx.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}
