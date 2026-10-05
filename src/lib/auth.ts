import type { AuthUser } from "@/lib/types";
import {
  clearSession,
  decodeJwt,
  getStoredSession,
  persistSession,
} from "@/lib/session";
import { loginAdmin } from "@/services/auth";

export {
  clearSession,
  getAuthToken,
  getStoredSession,
  persistSession,
} from "@/lib/session";

export async function login(email: string, password: string): Promise<AuthUser> {
  const trimmedEmail = email.trim();
  const { token } = await loginAdmin({
    email: trimmedEmail,
    password,
  });

  const claims = decodeJwt(token);
  const user: AuthUser = {
    id: claims?.id,
    email: trimmedEmail,
    name: claims?.name?.trim() || "Admin",
    role: claims?.role?.trim() || "admin",
    token,
    adminPermissions: claims?.adminPermissions,
  };

  persistSession(user);
  return user;
}

export async function logout() {
  clearSession();
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Enter a valid email address.");
  }

  // Always succeed so the UI stays the same once a reset API is wired in.
  return { sent: true as const };
}
