import VendorFiltersView from "@/components/vendors/VendorFiltersView";

type VendorFiltersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorFiltersPage({
  params,
}: VendorFiltersPageProps) {
  const { id } = await params;
  return <VendorFiltersView vendorId={id} />;
}
