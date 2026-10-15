import { createClient } from "@/lib/supabase/server";
import { H1, Lead } from "@/components/ui/typography";
import { AdminSettingsManager } from "@/components/admin/settings/admin-settings-manager";
import { DEFAULT_SETTINGS, LOKASI_DEFAULT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Toko | Admin PirantiKu",
  description: "Kelola informasi rekening bank, QRIS, kontak WhatsApp, dan lokasi pengambilan alat.",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Ambil seluruh baris settings
  const { data: settingsData, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error) {
    console.error("Gagal mengambil data settings:", error);
  }

  // Buat dictionary key -> value dengan fallback default
  const settingsMap: Record<string, string> = {
    rekening_bank: DEFAULT_SETTINGS.rekening_bank,
    qris_url: DEFAULT_SETTINGS.qris_url,
    dp_persen: String(DEFAULT_SETTINGS.dp_persen),
    denda_per_hari: String(DEFAULT_SETTINGS.denda_per_hari),
    whatsapp_admin: DEFAULT_SETTINGS.whatsapp_admin,
    jam_operasional: DEFAULT_SETTINGS.jam_operasional,
    alamat: LOKASI_DEFAULT.alamat,
    lokasi_lat: String(LOKASI_DEFAULT.lat),
    lokasi_lng: String(LOKASI_DEFAULT.lng),
    maps_embed_url: DEFAULT_SETTINGS.maps_embed_url,
  };

  if (settingsData) {
    settingsData.forEach((item) => {
      if (item.key && item.value !== null && item.value !== undefined) {
        settingsMap[item.key] = item.value;
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <H1 mode="word" className="section-title block">
          PENGATURAN TOKO & PEMBAYARAN
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Kelola nomor rekening bank, kode QRIS, kontak WhatsApp, tarif DP, dan alamat pengambilan alat.
        </Lead>
      </div>

      {/* Komponen Pengelola Pengaturan Interaktif */}
      <AdminSettingsManager initialSettings={settingsMap} />
    </div>
  );
}
