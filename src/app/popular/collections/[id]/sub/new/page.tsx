import PopularSubCollectionFormView from "@/components/popular-collections/PopularSubCollectionFormView";

type NewPopularSubCollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewPopularSubCollectionPage({
  params,
}: NewPopularSubCollectionPageProps) {
  const { id } = await params;
  return <PopularSubCollectionFormView collectionId={id} />;
}
