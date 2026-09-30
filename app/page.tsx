import { createClient } from "@/lib/supabase/server";
import { HomeView } from "@/components/home/home-view";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Category, EquipmentWithDetails } from "@/types/database";

export const revalidate = 60; // Revalidate data setiap 60 detik

export default async function HomePage() {
  let categories: Category[] = [];
  let popularEquipment: EquipmentWithDetails[] = [];
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;

  try {
    const supabase = await createClient();

    // 1. Ambil 5 Kategori teratas berurutan
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("*")
      .order("urutan", { ascending: true });

    if (catData && !catError) {
      categories = catData as Category[];
    }

    // 2. Ambil Alat Populer (aktif = true) beserta relasi kategori dan gambar
    const { data: eqData, error: eqError } = await supabase
      .from("equipment")
      .select(`
        *,
        category:categories(*),
        images:equipment_images(*)
      `)
      .eq("aktif", true)
      .limit(8);

    if (eqData && !eqError) {
      popularEquipment = eqData as EquipmentWithDetails[];
    }

    // 3. Ambil nomor WhatsApp admin dari settings
    const { data: waData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_admin")
      .single();

    if (waData?.value) {
      whatsappAdmin = waData.value;
    }
  } catch (err: unknown) {
    // Tangani dynamic server error Next.js bila ada
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("Gagal memuat data beranda dari database:", err);
  }

  return (
    <HomeView
      categories={categories}
      popularEquipment={popularEquipment}
      whatsappAdmin={whatsappAdmin}
    />
  );
}
