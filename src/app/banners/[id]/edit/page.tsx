import BannerFormView from "@/components/banners/BannerFormView";

type EditBannerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;
  return <BannerFormView bannerId={id} />;
}
