import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchUserById, formatUserJoinDate } from "@/lib/users";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const user = await fetchUserById(id);

  if (!user) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Users
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {user.name}
          </h2>
          <p className="mt-1 text-sm capitalize text-slate-500">{user.role}</p>
        </div>
        <Link
          href={`/users/${user.id}/edit`}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Edit user
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Mobile" value={user.mobile} />
          <DetailItem label="Email" value={user.email || "-"} />
          <DetailItem label="SMS verified" value={String(user.smsVerified)} />
          <DetailItem label="Blocked" value={String(user.blocked)} />
          <DetailItem label="Join date" value={formatUserJoinDate(user.joinedAt)} />
          <DetailItem label="Role" value={user.role} className="capitalize" />
        </dl>
      </div>

      <Link
        href="/users"
        className="inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
      >
        ← Back to users
      </Link>
    </div>
  );
}

function DetailItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-medium text-slate-900 ${className}`}>
        {value}
      </dd>
    </div>
  );
}
