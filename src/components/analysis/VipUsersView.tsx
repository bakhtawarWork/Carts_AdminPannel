"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useVipUsers } from "@/hooks/useVipUsers";
import { formatMoneySpent } from "@/lib/vip-users";
import type { VipUser } from "@/lib/types";

const PAGE_SIZE = 10;

export default function VipUsersView() {
  const [nameQuery, setNameQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedPhone, setDebouncedPhone] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedName(nameQuery);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [nameQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedPhone(phoneQuery);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [phoneQuery]);

  const { items, total, loading, error } = useVipUsers({
    name: debouncedName,
    phone: debouncedPhone,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to dashboard
        </Link>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          VIP Users
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          High-value customers with search and pagination.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <SearchField
            label="Search by name"
            value={nameQuery}
            onChange={setNameQuery}
            placeholder="Search by name"
          />
          <SearchField
            label="Search by phone"
            value={phoneQuery}
            onChange={setPhoneQuery}
            placeholder="Search by phone"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Phone number</th>
                    <th className="px-5 py-3.5 text-center">Orders</th>
                    <th className="px-5 py-3.5 text-right">Total money spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No VIP users match this search.
                      </td>
                    </tr>
                  ) : (
                    items.map((user) => <VipUserRow key={user.id} user={user} />)
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No VIP users match this search.
                </p>
              ) : (
                items.map((user) => <VipUserCard key={user.id} user={user} />)
              )}
            </div>
          </>
        )}

        <PaginationBar
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <SearchIcon />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {value ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        ) : null}
      </div>
    </label>
  );
}

function VipUserRow({ user }: { user: VipUser }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-5 py-4 font-medium text-slate-900">{user.name}</td>
      <td className="px-5 py-4 text-slate-600">{user.phone}</td>
      <td className="px-5 py-4 text-center tabular-nums text-slate-700">
        {user.orderCount.toLocaleString("en-US")}
      </td>
      <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
        {formatMoneySpent(user.totalSpent, user.currency)}
      </td>
    </tr>
  );
}

function VipUserCard({ user }: { user: VipUser }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <p className="font-semibold text-slate-900">{user.name}</p>
      <p className="mt-1 text-sm text-slate-500">{user.phone}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">
          {user.orderCount.toLocaleString("en-US")} orders
        </span>
        <span className="font-semibold tabular-nums text-slate-900">
          {formatMoneySpent(user.totalSpent, user.currency)}
        </span>
      </div>
    </article>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="m16.5 16.5 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
