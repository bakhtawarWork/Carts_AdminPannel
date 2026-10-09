import BannerFormView from "@/components/banners/BannerFormView";

type BannerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BannerPage({ params }: BannerPageProps) {
  const { id } = await params;
  return <BannerFormView bannerId={id} />;
}
