import SearchCategorySectionFormView from "@/components/search-categories/SearchCategorySectionFormView";

type EditSearchCategorySectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSearchCategorySectionPage({
  params,
}: EditSearchCategorySectionPageProps) {
  const { id } = await params;
  return <SearchCategorySectionFormView sectionId={id} />;
}
