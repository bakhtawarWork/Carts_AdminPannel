import CustomerOrdersView from "@/components/customers/CustomerOrdersView";

type CustomerOrdersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerOrdersPage({
  params,
}: CustomerOrdersPageProps) {
  const { id } = await params;
  return <CustomerOrdersView customerId={id} />;
}
