import VendorFormView from "@/components/vendors/VendorFormView";

type EditVendorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const { id } = await params;
  return <VendorFormView vendorId={id} />;
}
