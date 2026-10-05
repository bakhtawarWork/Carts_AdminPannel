import type { AuthUser } from "@/lib/types";

const SESSION_KEY = "cartsqa.admin.session";

type JwtClaims = {
  id?: string;
  name?: string;
  role?: string;
  adminPermissions?: string[];
  exp?: number;
};

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
  } catch {
    return null;
  }
}

export function getStoredSession(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.email || !parsed?.name || !parsed?.role || !parsed?.token) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function persistSession(user: AuthUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAuthToken(): string | null {
  return getStoredSession()?.token ?? null;
}
