import PopularCollectionDetailView from "@/components/popular-collections/PopularCollectionDetailView";

type CollectionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { id } = await params;
  return <PopularCollectionDetailView collectionId={id} section="collections" />;
}
