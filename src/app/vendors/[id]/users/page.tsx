import VendorUsersView from "@/components/vendors/VendorUsersView";

type VendorUsersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorUsersPage({ params }: VendorUsersPageProps) {
  const { id } = await params;
  return <VendorUsersView vendorId={id} />;
}
