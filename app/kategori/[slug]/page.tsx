import { PagePlaceholder } from "@/components/layout/page-placeholder";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return (
    <PagePlaceholder
      title={`Kategori: ${slug}`}
      description="Tempat menampilkan alat berdasarkan kategori."
    />
  );
}
