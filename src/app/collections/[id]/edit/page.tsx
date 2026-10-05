import PopularCollectionFormView from "@/components/popular-collections/PopularCollectionFormView";

type EditCollectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const { id } = await params;
  return <PopularCollectionFormView collectionId={id} section="collections" />;
}
