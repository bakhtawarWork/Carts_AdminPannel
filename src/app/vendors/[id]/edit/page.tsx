import VendorFormView from "@/components/vendors/VendorFormView";

type EditVendorPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ draft?: string }>;
};

export default async function EditVendorPage({
  params,
  searchParams,
}: EditVendorPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isDraft =
    resolvedSearchParams?.draft === "true" ||
    resolvedSearchParams?.draft === "1";
  return <VendorFormView vendorId={id} isDraft={isDraft} />;
}
