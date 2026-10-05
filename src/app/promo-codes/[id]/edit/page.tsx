import PromoCodeFormView from "@/components/promo-codes/PromoCodeFormView";

type EditPromoCodePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPromoCodePage({
  params,
}: EditPromoCodePageProps) {
  const { id } = await params;
  return <PromoCodeFormView promoId={id} />;
}
