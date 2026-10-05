import PopularSubCollectionFormView from "@/components/popular-collections/PopularSubCollectionFormView";

type EditPopularSubCollectionPageProps = {
  params: Promise<{ id: string; subId: string }>;
};

export default async function EditPopularSubCollectionPage({
  params,
}: EditPopularSubCollectionPageProps) {
  const { id, subId } = await params;
  return <PopularSubCollectionFormView collectionId={id} subId={subId} />;
}
