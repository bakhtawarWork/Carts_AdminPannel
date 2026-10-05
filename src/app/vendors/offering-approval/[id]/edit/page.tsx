import OfferingFormView from "@/components/vendors/OfferingFormView";

type EditOfferingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOfferingPage({ params }: EditOfferingPageProps) {
  const { id } = await params;
  return <OfferingFormView approvalId={id} />;
}
