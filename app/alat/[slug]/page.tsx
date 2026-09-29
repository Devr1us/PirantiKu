import { PagePlaceholder } from "@/components/layout/page-placeholder";

type EquipmentDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  const { slug } = await params;

  return (
    <PagePlaceholder
      title={`Detail alat: ${slug}`}
      description="Tempat detail alat, ketersediaan, dan pilihan tanggal rental."
    />
  );
}
