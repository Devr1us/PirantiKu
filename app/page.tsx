import { createClient } from "@/lib/supabase/server";
import { HomeView } from "@/components/home/home-view";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Category, EquipmentWithDetails } from "@/types/database";

export const revalidate = 60; // Revalidate data setiap 60 detik

export default async function HomePage() {
  let categories: Category[] = [];
  let newestEquipment: EquipmentWithDetails[] = [];
  let categoryCounts: Record<number, number> = {};
  let totalActiveTypes = 0;
  let totalAvailableUnits = 0;

  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;
  let dpPersen = DEFAULT_SETTINGS.dp_persen;
  let alamat = DEFAULT_SETTINGS.alamat;
  let jamOperasional = DEFAULT_SETTINGS.jam_operasional;
  let mapsEmbedUrl = DEFAULT_SETTINGS.maps_embed_url;

  try {
    const supabase = await createClient();

    // 1. Ambil kategori dari database berurutan
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("*")
      .order("urutan", { ascending: true });

    if (catData && !catError) {
      categories = catData as Category[];
    }

    // 2. Ambil 6 Alat Terbaru (aktif = true, created_at desc)
    const { data: eqData, error: eqError } = await supabase
      .from("equipment")
      .select(`
        *,
        category:categories(*),
        images:equipment_images(*)
      `)
      .eq("aktif", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (eqData && !eqError) {
      newestEquipment = eqData as EquipmentWithDetails[];
    }

    // 3. Ambil data inventaris aktif untuk statistik nyata & hitungan per kategori
    const { data: allActiveEq } = await supabase
      .from("equipment")
      .select("id, category_id, stok, stok_rusak")
      .eq("aktif", true);

    if (allActiveEq) {
      totalActiveTypes = allActiveEq.length;
      totalAvailableUnits = allActiveEq.reduce((acc, item) => {
        const available = Math.max(0, (item.stok || 0) - (item.stok_rusak || 0));
        return acc + available;
      }, 0);

      // Hitung jumlah alat aktif per category_id
      categoryCounts = allActiveEq.reduce((acc, item) => {
        if (item.category_id) {
          acc[item.category_id] = (acc[item.category_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);
    }

    // 4. Ambil pengaturan dari settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("key, value");

    if (settingsData) {
      settingsData.forEach((s) => {
        if (s.key === "whatsapp_admin" && s.value) whatsappAdmin = s.value;
        if (s.key === "dp_persen" && s.value) {
          const parsed = parseInt(s.value, 10);
          if (!isNaN(parsed)) dpPersen = parsed;
        }
        if (s.key === "alamat" && s.value) alamat = s.value;
        if (s.key === "jam_operasional" && s.value) jamOperasional = s.value;
        if (s.key === "maps_embed_url" && s.value) mapsEmbedUrl = s.value;
      });
    }
  } catch (err: unknown) {
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
      newestEquipment={newestEquipment}
      categoryCounts={categoryCounts}
      totalActiveTypes={totalActiveTypes}
      totalAvailableUnits={totalAvailableUnits}
      whatsappAdmin={whatsappAdmin}
      dpPersen={dpPersen}
      alamat={alamat}
      jamOperasional={jamOperasional}
      mapsEmbedUrl={mapsEmbedUrl}
    />
  );
}
