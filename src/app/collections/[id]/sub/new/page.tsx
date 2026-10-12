import CollectionItemFormView from "@/components/collections/CollectionItemFormView";

type NewSubCollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewSubCollectionPage({
  params,
}: NewSubCollectionPageProps) {
  const { id } = await params;
  return <CollectionItemFormView collectionId={id} />;
}
