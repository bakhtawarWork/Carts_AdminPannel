"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useState } from "react";

type HeaderProps = {
  title: string;
  onMenuClick?: () => void;
};

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  async function onSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
        >
          <MenuIcon />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 md:hidden">
            Carts
          </p>
          <h1 className="hidden truncate text-lg font-semibold text-slate-900 md:block">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{user?.name ?? "Admin"}</p>
          <p className="max-w-[180px] truncate text-xs text-slate-500">
            {user?.email}
          </p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {initials}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 sm:px-3"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
