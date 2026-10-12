import CollectionItemFormView from "@/components/collections/CollectionItemFormView";

type NewItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewCollectionItemPage({
  params,
}: NewItemPageProps) {
  const { id } = await params;
  return <CollectionItemFormView collectionId={id} />;
}
