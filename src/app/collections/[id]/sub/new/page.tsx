import PopularSubCollectionFormView from "@/components/popular-collections/PopularSubCollectionFormView";

type NewSubCollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewSubCollectionPage({
  params,
}: NewSubCollectionPageProps) {
  const { id } = await params;
  return (
    <PopularSubCollectionFormView collectionId={id} section="collections" />
  );
}
