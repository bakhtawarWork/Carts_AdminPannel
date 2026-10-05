import VendorReviewsView from "@/components/vendors/VendorReviewsView";

type VendorReviewsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorReviewsPage({
  params,
}: VendorReviewsPageProps) {
  const { id } = await params;
  return <VendorReviewsView vendorId={id} />;
}
