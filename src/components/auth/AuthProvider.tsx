"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getStoredSession,
  login as loginRequest,
  logout as logoutRequest,
  requestPasswordReset,
} from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

const AUTH_ROUTES = new Set(["/", "/login", "/forgot-password"]);
const DASHBOARD_PATH = "/dashboard";
const LOGIN_PATH = "/";
const LOG = "[AuthProvider]";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    console.log(LOG, "hydrate session", {
      email: session?.email ?? null,
      name: session?.name ?? null,
    });
    setUser(session);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const onAuthRoute = AUTH_ROUTES.has(pathname);
    console.log(LOG, "route guard", { ready, user: user?.email ?? null, pathname, onAuthRoute });

    if (!user && !onAuthRoute) {
      console.log(LOG, "redirect → login", LOGIN_PATH);
      router.replace(LOGIN_PATH);
      return;
    }

    if (user && onAuthRoute) {
      console.log(LOG, "redirect → dashboard", DASHBOARD_PATH);
      router.replace(DASHBOARD_PATH);
    }
  }, [ready, user, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    console.log(LOG, "login()", { email });

    const nextUser = await loginRequest(email, password);
    console.log(LOG, "loginRequest ok", {
      email: nextUser.email,
      name: nextUser.name,
      role: nextUser.role,
    });
    setUser(nextUser);

    // Hard navigation avoids soft-router races that can leave you on `/`.
    console.log(LOG, "hard navigate →", DASHBOARD_PATH);
    window.location.assign(DASHBOARD_PATH);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    console.log(LOG, "logout()");
    await logoutRequest();
    setUser(null);
    window.location.assign(LOGIN_PATH);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await requestPasswordReset(email);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, forgotPassword }),
    [user, ready, login, logout, forgotPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.has(pathname);
}
