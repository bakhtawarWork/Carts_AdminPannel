import CollectionItemFormView from "@/components/collections/CollectionItemFormView";

type EditSubCollectionPageProps = {
  params: Promise<{ id: string; subId: string }>;
};

export default async function EditSubCollectionPage({
  params,
}: EditSubCollectionPageProps) {
  const { id, subId } = await params;
  return <CollectionItemFormView collectionId={id} itemId={subId} />;
}
