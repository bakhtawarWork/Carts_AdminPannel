import OrderDetailsView from "@/components/orders/OrderDetailsView";

type OrderDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  return <OrderDetailsView orderId={id} />;
}
