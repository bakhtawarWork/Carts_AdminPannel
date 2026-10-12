import CollectionItemFormView from "@/components/collections/CollectionItemFormView";

type EditItemPageProps = {
  params: Promise<{ id: string; itemId: string }>;
};

export default async function EditCollectionItemPage({
  params,
}: EditItemPageProps) {
  const { id, itemId } = await params;
  return <CollectionItemFormView collectionId={id} itemId={itemId} />;
}
