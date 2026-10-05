import OfferingFormView from "@/components/vendors/OfferingFormView";

type NewVendorOfferingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewVendorOfferingPage({
  params,
}: NewVendorOfferingPageProps) {
  const { id } = await params;
  return <OfferingFormView vendorId={id} />;
}
