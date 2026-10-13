import CustomerProfileView from "@/components/customers/CustomerProfileView";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  return <CustomerProfileView customerId={id} />;
}
