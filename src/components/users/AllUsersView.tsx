"use client";

import { useCallback, useEffect, useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { api } from "@/services/api";
import {
  USER_ROLE_OPTIONS,
  downloadUsersCsv,
} from "@/lib/users";
import type { UserRecord, UserRole } from "@/lib/types";

const PAGE_SIZE = 20;

type ApiUser = {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  smsVerified?: boolean;
  isBlocked?: boolean;
  role?: string;
  createdAt?: string;
};

type ApiPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiUsersResponse = {
  status: boolean;
  message: string;
  data: {
    users: ApiUser[];
    pagination: ApiPagination;
  };
};

function formatJoinDate(value?: string) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return "-";
  }
}

function mapApiUser(user: ApiUser): UserRecord {
  return {
    id: user._id,
    name: user.name?.trim() || "-",
    mobile: user.mobile || "-",
    smsVerified: Boolean(user.smsVerified),
    blocked: Boolean(user.isBlocked),
    email: user.email || "-",
    joinedAt: user.createdAt || "",
    role: (user.role === "vendor" ? "vendor" : "customer") as UserRole,
  };
}

const EMPTY_FILTERS = {
  search: "",
  role: "" as const,
  joinedFrom: "",
  joinedTo: "",
};

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AllUsersView() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<"" | UserRole>("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [items, setItems] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsersList() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        if (role) {
          params.set("type", role);
        }
        if (joinedFrom) {
          params.set("joinedFrom", joinedFrom);
        }
        if (joinedTo) {
          params.set("joinedTo", joinedTo);
        }

        const endpoint = `users?${params.toString()}`;
        const res = await api.get<ApiUsersResponse>(endpoint);

        if (cancelled) return;

        if (res && res.data) {
          const rawUsers = Array.isArray(res.data.users) ? res.data.users : [];
          setItems(rawUsers.map(mapApiUser));

          if (res.data.pagination) {
            setTotal(res.data.pagination.total ?? rawUsers.length);
            if (res.data.pagination.limit) {
              setPageSize(res.data.pagination.limit);
            }
          } else {
            setTotal(rawUsers.length);
          }
        } else {
          setItems([]);
          setTotal(0);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch users.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUsersList();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, role, joinedFrom, joinedTo, refreshKey]);

  function resetFilters() {
    setSearch(EMPTY_FILTERS.search);
    setDebouncedSearch(EMPTY_FILTERS.search);
    setRole(EMPTY_FILTERS.role);
    setJoinedFrom(EMPTY_FILTERS.joinedFrom);
    setJoinedTo(EMPTY_FILTERS.joinedTo);
    setPage(1);
    reload();
  }

  function toggleSort() {
    setSortDir((current) => (current === "desc" ? "asc" : "desc"));
  }

  const sortedItems = [...items].sort((a, b) => {
    const delta =
      new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    return sortDir === "asc" ? delta : -delta;
  });

  async function handleExport() {
    setExporting(true);
    try {
      downloadUsersCsv(sortedItems, `users-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      setActionError("Unable to export users.");
    } finally {
      setExporting(false);
    }
  }

  async function handleBlock(user: UserRecord) {
    setActionError(null);
    setBlockingId(user.id);
    const action = user.blocked ? "unblock" : "block";

    try {
      const res = await api.post<{
        status: boolean;
        message: string;
        data?: {
          user?: {
            _id?: string;
            isBlocked?: boolean;
            name?: string;
            email?: string;
            mobile?: string;
          };
        };
      }>(`users/${user.id}/${action}`);

      const nextBlocked =
        res?.data?.user?.isBlocked !== undefined
          ? res.data.user.isBlocked
          : !user.blocked;

      setItems((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, blocked: nextBlocked } : item
        )
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Unable to ${action} user.`;
      setActionError(message);
    } finally {
      setBlockingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Users
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Users
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage platform users, roles, and account status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
        >
          <ExportIcon />
          {exporting ? "Downloading…" : "Download Excel sheet"}
        </button>
      </div>

      {error || actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? actionError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
            <label className="block min-w-0 lg:col-span-4">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Search by name, mobile phone number or email
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, mobile phone number or email"
                className={inputClassName}
              />
            </label>

            <label className="block min-w-0 lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                User type
              </span>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as "" | UserRole);
                  setPage(1);
                }}
                className={inputClassName}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0 lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Joined from
              </span>
              <input
                type="date"
                value={joinedFrom}
                onChange={(event) => {
                  setJoinedFrom(event.target.value);
                  setPage(1);
                }}
                className={inputClassName}
              />
            </label>

            <label className="block min-w-0 lg:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                to
              </span>
              <input
                type="date"
                value={joinedTo}
                onChange={(event) => {
                  setJoinedTo(event.target.value);
                  setPage(1);
                }}
                className={inputClassName}
              />
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:col-span-2"
            >
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Mobile</th>
                    <th className="px-5 py-3.5">SMS Verified</th>
                    <th className="px-5 py-3.5">Blocked</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={toggleSort}
                        className="inline-flex items-center gap-1.5 transition hover:text-slate-700"
                      >
                        Join Date
                        <SortIcon direction={sortDir} />
                      </button>
                    </th>
                    <th className="px-5 py-3.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No users match these filters.
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        blocking={blockingId === user.id}
                        onBlock={() => handleBlock(user)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 xl:hidden">
              {sortedItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No users match these filters.
                </p>
              ) : (
                sortedItems.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    blocking={blockingId === user.id}
                    onBlock={() => handleBlock(user)}
                  />
                ))
              )}
            </div>
          </>
        )}

        <PaginationBar
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function UserRow({
  user,
  blocking,
  onBlock,
}: {
  user: UserRecord;
  blocking: boolean;
  onBlock: () => void;
}) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-5 py-4 font-medium text-slate-900">{user.name}</td>
      <td className="px-5 py-4 text-slate-700">{user.mobile}</td>
      <td className="px-5 py-4 text-slate-700">{String(user.smsVerified)}</td>
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onBlock}
          disabled={blocking}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {blocking ? "…" : user.blocked ? "Unblock" : "Block"}
        </button>
      </td>
      <td className="px-5 py-4 text-slate-600">{user.email || "-"}</td>
      <td className="px-5 py-4 text-slate-600">
        {formatJoinDate(user.joinedAt)}
      </td>
      <td className="px-5 py-4 capitalize text-slate-700">{user.role}</td>
    </tr>
  );
}

function UserCard({
  user,
  blocking,
  onBlock,
}: {
  user: UserRecord;
  blocking: boolean;
  onBlock: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <div>
        <p className="font-semibold text-slate-900">{user.name}</p>
        <p className="mt-0.5 text-sm capitalize text-slate-500">{user.role}</p>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Mobile</dt>
          <dd className="text-slate-700">{user.mobile}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">SMS verified</dt>
          <dd className="text-slate-700">{String(user.smsVerified)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Email</dt>
          <dd className="text-right text-slate-700">{user.email || "-"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Join date</dt>
          <dd className="text-slate-700">{formatJoinDate(user.joinedAt)}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onBlock}
        disabled={blocking}
        className="mt-3 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {blocking ? "Updating…" : user.blocked ? "Unblock" : "Block"}
      </button>
    </article>
  );
}

function ExportIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v10m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIcon({ direction }: { direction: "asc" | "desc" }) {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "desc" ? "M12 6v12m0 0 4-4m-4 4-4-4" : "M12 18V6m0 0-4 4m4-4 4 4"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
