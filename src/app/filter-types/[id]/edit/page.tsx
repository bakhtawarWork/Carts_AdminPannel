import FilterTypeFormView from "@/components/filter-types/FilterTypeFormView";

type EditFilterTypePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFilterTypePage({
  params,
}: EditFilterTypePageProps) {
  const { id } = await params;
  return <FilterTypeFormView filterTypeId={id} />;
}
