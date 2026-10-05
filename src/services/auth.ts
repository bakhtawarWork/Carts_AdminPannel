import { ApiError, api } from "@/services/api";
import { AUTH_ENDPOINTS } from "@/services/endpoints";

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export type AdminLoginResponse = {
  token: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractToken(payload: unknown): string | null {
  const record = asRecord(payload);
  if (!record) return null;

  for (const key of ["token", "accessToken", "access_token"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.replace(/^Bearer\s+/i, "").trim();
    }
  }

  return extractToken(record.data) ?? extractToken(record.result);
}

export async function loginAdmin(payload: AdminLoginPayload) {
  try {
    const data = await api.post<unknown>(AUTH_ENDPOINTS.adminLogin, payload, {
      auth: false,
    });

    const token = extractToken(data);
    if (!token) {
      throw new ApiError("Login succeeded but no token was returned.", 200, data);
    }

    return { token } satisfies AdminLoginResponse;
  } catch (caught) {
    if (caught instanceof ApiError && (caught.status === 400 || caught.status === 401)) {
      throw new ApiError("Invalid email or password.", caught.status, caught.data);
    }
    throw caught;
  }
}
