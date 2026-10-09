"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatVendorDate } from "@/lib/vendors";
import {
  createVendorUser,
  fetchVendorUserById,
  fetchVendorUsers,
  getVendorUserSaveErrorMessage,
  setVendorUserBlocked,
  updateVendorUser,
  userInitials,
  vendorUserFormFromRecord,
} from "@/lib/vendor-users";
import type { VendorRecord, VendorUserFormData, VendorUserRecord } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

const emptyForm: VendorUserFormData = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  isBlocked: false,
};

type VendorUsersViewProps = {
  vendorId: string;
};

type ModalMode = "info" | "edit" | "create" | "block" | null;

export default function VendorUsersView({ vendorId }: VendorUsersViewProps) {
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [users, setUsers] = useState<VendorUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeUser, setActiveUser] = useState<VendorUserRecord | null>(null);
  const [form, setForm] = useState<VendorUserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVendorUsers(vendorId);
      setVendor(response.vendor);
      setUsers(response.items);
    } catch (caught) {
      setVendor(null);
      setUsers([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load vendor users.",
      );
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const activeCount = users.filter((user) => !user.blocked).length;
  const blockedCount = users.filter((user) => user.blocked).length;

  function openCreate() {
    setActiveUser(null);
    setForm(emptyForm);
    setModalMode("create");
    setError(null);
    setMessage(null);
  }

  function openInfo(user: VendorUserRecord) {
    setActiveUser(user);
    setModalMode("info");
  }

  async function openEdit(user: VendorUserRecord) {
    setActiveUser(user);
    setForm(vendorUserFormFromRecord(user));
    setModalMode("edit");
    setError(null);
    setMessage(null);
    setEditLoading(true);

    try {
      const details = await fetchVendorUserById(user.id, vendorId);
      setActiveUser(details);
      setForm((prev) => ({
        ...vendorUserFormFromRecord(details),
        password: prev.password || "",
      }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load user details.",
      );
    } finally {
      setEditLoading(false);
    }
  }

  function openBlock(user: VendorUserRecord) {
    setActiveUser(user);
    setModalMode("block");
    setError(null);
  }

  function closeModal() {
    setModalMode(null);
    setActiveUser(null);
    setForm(emptyForm);
    setEditLoading(false);
  }

  function updateField<K extends keyof VendorUserFormData>(
    key: K,
    value: VendorUserFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const result = await createVendorUser(vendorId, form);
      await loadUsers();
      closeModal();
      setMessage(result.message || "Vendor user created successfully.");
    } catch (caught) {
      setError(getVendorUserSaveErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!activeUser) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateVendorUser(vendorId, activeUser.id, form);
      await loadUsers();
      closeModal();
      setMessage(result.message || "User updated successfully.");
    } catch (caught) {
      setError(getVendorUserSaveErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleBlockToggle() {
    if (!activeUser) return;
    setSaving(true);
    setError(null);
    try {
      const result = await setVendorUserBlocked(
        vendorId,
        activeUser.id,
        !activeUser.blocked,
        activeUser,
      );
      await loadUsers();
      closeModal();
      setMessage(
        result.message ||
          (activeUser.blocked
            ? "User unblocked successfully."
            : "User blocked successfully."),
      );
    } catch (caught) {
      setError(getVendorUserSaveErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading vendor users…
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-12 text-center text-sm text-red-700">
        {error ?? "Vendor not found."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Vendors
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Vendor Users
          </h2>
          {vendor.englishName || vendor.arabicName ? (
            <p className="mt-1 text-sm text-slate-500" dir="auto">
              {[vendor.englishName, vendor.arabicName].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">
            Accounts with login access to this vendor dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/vendors"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to vendors
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            <PlusIcon />
            Create user
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total users" value={users.length} />
        <StatCard label="Active" value={activeCount} tone="active" />
        <StatCard label="Blocked" value={blockedCount} tone="blocked" />
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-medium text-slate-700">
            No users have access yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Create the first login account for this vendor.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Create user
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((user, index) => (
            <UserAccessCard
              key={user.id}
              user={user}
              index={index + 1}
              onInfo={() => openInfo(user)}
              onEdit={() => void openEdit(user)}
              onBlock={() => openBlock(user)}
            />
          ))}
        </div>
      )}

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {message}
        </p>
      ) : null}
      {error && !modalMode ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      {modalMode === "info" && activeUser ? (
        <Modal
          title="User information"
          onClose={closeModal}
          footer={
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          }
        >
          <InfoGrid user={activeUser} />
        </Modal>
      ) : null}

      {modalMode === "edit" && activeUser ? (
        <Modal
          title="Edit user"
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={saving || editLoading}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          }
        >
          {editLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading user details…
            </p>
          ) : (
            <UserFormFields
              form={form}
              onChange={updateField}
              mode="edit"
            />
          )}
          {error ? <ModalError message={error} /> : null}
        </Modal>
      ) : null}

      {modalMode === "create" ? (
        <Modal
          title="Create user"
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create user"}
              </button>
            </>
          }
        >
          <UserFormFields
            form={form}
            onChange={updateField}
            mode="create"
          />
          {error ? <ModalError message={error} /> : null}
        </Modal>
      ) : null}

      {modalMode === "block" && activeUser ? (
        <Modal
          title={activeUser.blocked ? "Unblock user" : "Block user"}
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleBlockToggle}
                disabled={saving}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  activeUser.blocked
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-brand hover:bg-brand-hover"
                }`}
              >
                {saving ? "Updating…" : "Yes"}
              </button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-slate-600">
            {activeUser.blocked
              ? `Allow ${activeUser.name} to sign in again?`
              : `Are you sure you want to block ${activeUser.name}? They will lose dashboard access.`}
          </p>
          {error ? <ModalError message={error} /> : null}
        </Modal>
      ) : null}
    </div>
  );
}

function UserAccessCard({
  user,
  index,
  onInfo,
  onEdit,
  onBlock,
}: {
  user: VendorUserRecord;
  index: number;
  onInfo: () => void;
  onEdit: () => void;
  onBlock: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
            user.blocked
              ? "bg-slate-100 text-slate-500"
              : "bg-brand/10 text-brand"
          }`}
        >
          {userInitials(user.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              #{index}
            </span>
            <StatusPill blocked={user.blocked} />
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-slate-900">
            {user.name}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-600">{user.email}</p>
          <p className="mt-0.5 text-sm text-slate-500">{user.mobile}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <ActionChip label="Show info" onClick={onInfo}>
          <InfoIcon />
        </ActionChip>
        <ActionChip label="Edit user" onClick={onEdit}>
          <EditIcon />
        </ActionChip>
        <ActionChip
          label={user.blocked ? "Unblock user" : "Block user"}
          onClick={onBlock}
          danger={!user.blocked}
        >
          {user.blocked ? <UnlockIcon /> : <LockIcon />}
        </ActionChip>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "active" | "blocked";
}) {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-900",
    active: "border-emerald-100 bg-emerald-50/60 text-emerald-800",
    blocked: "border-red-100 bg-red-50/60 text-red-800",
  }[tone];

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        blocked
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function InfoGrid({ user }: { user: VendorUserRecord }) {
  return (
    <dl className="space-y-4">
      <InfoRow label="Name" value={user.name} />
      <InfoRow label="Email" value={user.email} />
      <InfoRow label="Mobile" value={user.mobile} />
      <InfoRow label="Status" value={user.blocked ? "Blocked" : "Active"} />
      <InfoRow label="Created" value={formatVendorDate(user.createdAt)} />
    </dl>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900" dir="auto">
        {value}
      </dd>
    </div>
  );
}

function UserFormFields({
  form,
  onChange,
  mode,
}: {
  form: VendorUserFormData;
  onChange: <K extends keyof VendorUserFormData>(
    key: K,
    value: VendorUserFormData[K],
  ) => void;
  mode: "create" | "edit";
}) {
  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          type="text"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Mobile">
        <input
          type="tel"
          value={form.mobile}
          onChange={(event) => onChange("mobile", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field
        label="Password"
        hint={
          mode === "edit" ? "Leave blank to keep current password" : undefined
        }
      >
        <input
          type="password"
          name="password"
          id="vendor-user-password"
          autoComplete={mode === "create" ? "new-password" : "current-password"}
          value={form.password ?? ""}
          onChange={(event) => onChange("password", event.target.value)}
          required={mode === "create"}
          placeholder={mode === "edit" ? "••••••••" : "Enter password"}
          className={inputClass}
        />
      </Field>
      {mode === "edit" ? (
        <label className="inline-flex h-[42px] w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3">
          <input
            type="checkbox"
            checked={form.isBlocked}
            onChange={(event) => onChange("isBlocked", event.target.checked)}
            className="h-5 w-5 shrink-0 rounded border-slate-300 accent-brand"
          />
          <span className="text-sm font-semibold text-slate-900">
            Blocked
          </span>
        </label>
      ) : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

function ModalError({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
      {message}
    </p>
  );
}

function ActionChip({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        danger
          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 19c.8-2.8 2.8-4.5 5.5-4.5s4.7 1.7 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m4 20 1.2-4.2L15.3 5.7a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1L8.2 20H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="6"
        y="10"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 10V8a3 3 0 1 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="6"
        y="10"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 10V8a3 3 0 0 1 5.5-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
