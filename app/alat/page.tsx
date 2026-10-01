import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EquipmentCatalog } from "@/components/equipment/equipment-catalog";
import { APP_NAME } from "@/lib/constants";
import type { Category, EquipmentWithDetails } from "@/types/database";

export const metadata: Metadata = {
  title: `Katalog Alat Rental | ${APP_NAME}`,
  description: `Sewa alat camping, pertukangan, olahraga, kebersihan, dan event di ${APP_NAME}. DP ringan, stok transparan per tanggal.`,
};

export default async function AlatPage() {
  const supabase = await createClient();

  // 1. Ambil semua kategori aktif
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*")
    .order("urutan", { ascending: true });

  const categories = (categoriesData || []) as Category[];

  // 2. Ambil seluruh alat aktif beserta relasi
  const { data: equipmentData } = await supabase
    .from("equipment")
    .select(`
      *,
      category:categories(*),
      images:equipment_images(*)
    `)
    .eq("aktif", true);

  const initialEquipment = (equipmentData || []) as EquipmentWithDetails[];

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
            <p className="text-sm text-[#5F7A84]">Memuat katalog alat...</p>
          </div>
        </div>
      }
    >
      <EquipmentCatalog
        initialEquipment={initialEquipment}
        categories={categories}
      />
    </React.Suspense>
  );
}
