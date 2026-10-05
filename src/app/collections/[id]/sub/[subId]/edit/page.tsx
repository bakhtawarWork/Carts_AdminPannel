import PopularSubCollectionFormView from "@/components/popular-collections/PopularSubCollectionFormView";

type EditSubCollectionPageProps = {
  params: Promise<{ id: string; subId: string }>;
};

export default async function EditSubCollectionPage({
  params,
}: EditSubCollectionPageProps) {
  const { id, subId } = await params;
  return (
    <PopularSubCollectionFormView
      collectionId={id}
      subId={subId}
      section="collections"
    />
  );
}
