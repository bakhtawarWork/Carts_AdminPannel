import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f8] px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand/5" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-brand/5" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={72} priority className="drop-shadow-sm" />
          <p className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
            Carts
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
