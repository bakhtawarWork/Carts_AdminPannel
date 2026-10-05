import VendorOfferingsView from "@/components/vendors/VendorOfferingsView";

type VendorOfferingsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorOfferingsPage({
  params,
}: VendorOfferingsPageProps) {
  const { id } = await params;
  return <VendorOfferingsView vendorId={id} />;
}
