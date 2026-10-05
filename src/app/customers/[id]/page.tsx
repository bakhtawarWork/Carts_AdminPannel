import AllCustomersView from "@/components/customers/AllCustomersView";
import { fetchCustomerById } from "@/lib/customers";
import { formatCustomerLastOrdered, formatCustomerMoney } from "@/lib/customers";
import Link from "next/link";
import { notFound } from "next/navigation";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await fetchCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Customers
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {customer.name}
          </h2>
        </div>
        <Link
          href="/customers"
          className="inline-flex items-center justify-center self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to customers
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Name" value={customer.name} />
          <DetailItem
            label="No. of orders"
            value={String(customer.orderCount)}
          />
          <DetailItem
            label="Total money spent"
            value={formatCustomerMoney(customer.totalSpent, customer.currency)}
          />
          <DetailItem
            label="Last ordered at"
            value={formatCustomerLastOrdered(customer.lastOrderedAt)}
          />
        </dl>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
