import * as React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EquipmentCatalog } from "@/components/equipment/equipment-catalog";
import { APP_NAME, getCategoryDescription } from "@/lib/constants";
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

  return {
    title: `Sewa Alat ${cat.nama} | ${APP_NAME}`,
    description: `Pilihan perlengkapan ${cat.nama} siap sewa di ${APP_NAME}. Kualitas prima dan stok pasti ada.`,
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

  const initialEquipment = (equipmentData || []) as EquipmentWithDetails[];
  const desc = getCategoryDescription(currentCategory.slug);

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
            <p className="text-sm text-[#5F7A84]">
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
