import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchUserById } from "@/lib/users";

type UserEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserEditPage({ params }: UserEditPageProps) {
  const { id } = await params;
  const user = await fetchUserById(id);

  if (!user) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Users
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Edit {user.name}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          User edit form will connect to the API here.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Edit form placeholder for {user.email || user.mobile}.
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/users/${user.id}`}
          className="inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
        >
          ← Back to profile
        </Link>
        <Link
          href="/users"
          className="inline-flex text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          Back to users list
        </Link>
      </div>
    </div>
  );
}
