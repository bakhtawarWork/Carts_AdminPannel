import PopularCollectionDetailView from "@/components/popular-collections/PopularCollectionDetailView";

type PopularCollectionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PopularCollectionDetailPage({
  params,
}: PopularCollectionDetailPageProps) {
  const { id } = await params;
  return <PopularCollectionDetailView collectionId={id} />;
}
