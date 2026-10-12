import CustomerOrdersView from "@/components/customers/CustomerOrdersView";
import { fetchCustomerById } from "@/lib/customers";
import { notFound } from "next/navigation";

type CustomerOrdersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerOrdersPage({
  params,
}: CustomerOrdersPageProps) {
  const { id } = await params;
  const customer = await fetchCustomerById(id);

  if (!customer) {
    notFound();
  }

  return <CustomerOrdersView customer={customer} />;
}
