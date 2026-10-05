"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { NavIconGlyph } from "@/components/layout/NavIcons";
import {
  APP_NAV,
  isNavGroupActive,
  isNavLinkActive,
  type NavGroup,
  type NavLink,
} from "@/lib/nav";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const inactiveClass =
  "text-slate-300 hover:bg-white/5 hover:text-white";
const activeClass = "bg-brand font-medium text-white";

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <aside className="hidden h-screen min-h-0 w-64 shrink-0 flex-col bg-slate-950 text-slate-200 md:flex">
        <SidebarBrand />
        <SidebarNav pathname={pathname} />
      </aside>

      <div
        className={`fixed inset-0 z-40 md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={`absolute inset-0 bg-slate-950/50 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute inset-y-0 left-0 flex min-h-0 w-[min(18rem,85vw)] flex-col bg-slate-950 text-slate-200 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <SidebarBrand compact />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
          <SidebarNav pathname={pathname} onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}

function SidebarBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b border-white/10 ${
        compact ? "border-0 px-0" : "h-16 px-5"
      }`}
    >
      <Logo size={32} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-wide text-white">
          Carts
        </p>
        <p className="truncate text-[11px] text-slate-400">Admin panel</p>
      </div>
    </div>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
      {APP_NAV.map((item) => {
        if (item.type === "link") {
          return (
            <NavLinkItem
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <NavGroupItem
            key={item.id}
            group={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

function NavLinkItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLink;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isNavLinkActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active ? activeClass : inactiveClass
      }`}
    >
      <NavIconGlyph icon={item.icon} className="h-4 w-4 shrink-0 opacity-90" />
      <span>{item.label}</span>
    </Link>
  );
}

function NavGroupItem({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  const groupActive = isNavGroupActive(pathname, group.children);
  const [open, setOpen] = useState(groupActive);

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
          groupActive
            ? "bg-white/10 font-medium text-white"
            : inactiveClass
        }`}
      >
        <span className="flex items-center gap-2.5">
          <NavIconGlyph icon={group.icon} className="h-4 w-4 shrink-0 opacity-90" />
          {group.label}
        </span>
        <ChevronIcon open={open} />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-3 space-y-0.5 border-l border-white/10 py-1 pl-2">
            {group.children.map((child) => {
              const active = isNavLinkActive(pathname, child.href);

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? activeClass : inactiveClass
                  }`}
                >
                  <NavIconGlyph
                    icon={child.icon}
                    className="h-4 w-4 shrink-0 opacity-90"
                  />
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
