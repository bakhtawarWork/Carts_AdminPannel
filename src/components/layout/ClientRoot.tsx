"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  AuthProvider,
  isAuthRoute,
  useAuth,
} from "@/components/auth/AuthProvider";
import AdminShell from "@/components/layout/AdminShell";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

function AppGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const onAuthRoute = isAuthRoute(pathname);

  if (!ready) {
    return onAuthRoute ? children : <LoadingScreen />;
  }

  if (!user) {
    return onAuthRoute ? children : <LoadingScreen />;
  }

  if (onAuthRoute) {
    return <LoadingScreen />;
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppGate>{children}</AppGate>
    </AuthProvider>
  );
}
