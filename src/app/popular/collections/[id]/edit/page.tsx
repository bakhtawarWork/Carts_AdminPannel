import PopularCollectionFormView from "@/components/popular-collections/PopularCollectionFormView";

type EditPopularCollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPopularCollectionPage({
  params,
}: EditPopularCollectionPageProps) {
  const { id } = await params;
  return <PopularCollectionFormView collectionId={id} />;
}
