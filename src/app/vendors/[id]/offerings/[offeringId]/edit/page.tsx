import OfferingFormView from "@/components/vendors/OfferingFormView";

type EditVendorOfferingPageProps = {
  params: Promise<{ id: string; offeringId: string }>;
};

export default async function EditVendorOfferingPage({
  params,
}: EditVendorOfferingPageProps) {
  const { id, offeringId } = await params;
  return <OfferingFormView vendorId={id} offeringId={offeringId} />;
}
