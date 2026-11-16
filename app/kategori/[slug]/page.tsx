import * as React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EquipmentCatalog } from "@/components/equipment/equipment-catalog";
import { APP_NAME, getCategoryDescription } from "@/lib/constants";
import { fetchRentedUnitsSummary, enrichEquipmentWithStock } from "@/lib/inventory";
import type { Category, EquipmentWithDetails } from "@/types/database";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("nama")
    .eq("slug", slug)
    .single();

  if (!cat) {
    return { title: "Kategori Tidak Ditemukan" };
  }

  const pageTitle = `Booking Alat ${cat.nama}`;
  const desc = `Pilihan perlengkapan ${cat.nama} siap booking di ${APP_NAME}. Kualitas prima dan stok pasti ada.`;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pirantiku.web.id";

  return {
    title: pageTitle,
    description: desc,
    alternates: {
      canonical: `/kategori/${slug}`,
    },
    openGraph: {
      title: `${pageTitle} | ${APP_NAME}`,
      description: desc,
      url: `/kategori/${slug}`,
      images: [
        {
          url: `${siteUrl}/logo.png`,
          width: 800,
          height: 600,
          alt: `${APP_NAME} - ${cat.nama}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | ${APP_NAME}`,
      description: desc,
      images: [`${siteUrl}/logo.png`],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Ambil data kategori saat ini
  const { data: catData, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (catError || !catData) {
    notFound();
  }

  const currentCategory = catData as Category;

  // 2. Ambil semua kategori untuk filter
  const { data: allCategoriesData } = await supabase
    .from("categories")
    .select("*")
    .order("urutan", { ascending: true });

  const categories = (allCategoriesData || []) as Category[];

  // 3. Ambil seluruh alat dalam kategori ini
  const { data: equipmentData } = await supabase
    .from("equipment")
    .select(`
      *,
      category:categories(*),
      images:equipment_images(*)
    `)
    .eq("category_id", currentCategory.id)
    .eq("aktif", true);

  // 4. Rekap unit sedang disewa untuk kategori ini
  const rentedMap = await fetchRentedUnitsSummary(supabase);
  const initialEquipment = enrichEquipmentWithStock(
    (equipmentData || []) as EquipmentWithDetails[],
    rentedMap
  );
  const desc = getCategoryDescription(currentCategory.slug);

  return (
    <React.Suspense
      fallback={
        <div data-nosnippet aria-hidden="true" className="site-container py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
            <p data-nosnippet aria-hidden="true" className="text-sm text-[#5F7A84]">
              Memuat kategori {currentCategory.nama}...
            </p>
          </div>
        </div>
      }
    >
      <EquipmentCatalog
        initialEquipment={initialEquipment}
        categories={categories}
        selectedCategorySlug={currentCategory.slug}
        categoryTitle={`Kategori: ${currentCategory.nama}`}
        categoryDescription={desc}
      />
    </React.Suspense>
  );
}
