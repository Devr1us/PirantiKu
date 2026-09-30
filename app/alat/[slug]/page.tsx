import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatSpecKey } from "@/lib/format";
import { getCategoryAccent, APP_NAME } from "@/lib/constants";
import type { EquipmentWithDetails } from "@/types/database";
import { RentalBookingWidget } from "@/components/equipment/rental-booking-widget";
import { EquipmentCard } from "@/components/equipment/equipment-card";

interface EquipmentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EquipmentDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("equipment")
    .select("nama, deskripsi")
    .eq("slug", slug)
    .single();

  if (!item) {
    return { title: "Alat Tidak Ditemukan" };
  }

  return {
    title: `${item.nama} | ${APP_NAME}`,
    description: item.deskripsi || `Sewa ${item.nama} di ${APP_NAME}. Kualitas prima, DP ringan.`,
  };
}

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Ambil data alat beserta kategori dan foto
  const { data: equipmentData, error } = await supabase
    .from("equipment")
    .select(`
      *,
      category:categories(*),
      images:equipment_images(*)
    `)
    .eq("slug", slug)
    .single();

  if (error || !equipmentData) {
    notFound();
  }

  const equipment = equipmentData as EquipmentWithDetails;

  // 2. Ambil nilai dp_persen dari settings
  let dpPersen = 30;
  const { data: dpSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "dp_persen")
    .single();

  if (dpSetting?.value) {
    const parsed = parseInt(dpSetting.value, 10);
    if (!isNaN(parsed)) dpPersen = parsed;
  }

  // 3. Ambil rekomendasi alat terkait (kategori yang sama, selain alat ini)
  let relatedEquipment: EquipmentWithDetails[] = [];
  if (equipment.category_id) {
    const { data: relatedData } = await supabase
      .from("equipment")
      .select(`
        *,
        category:categories(*),
        images:equipment_images(*)
      `)
      .eq("category_id", equipment.category_id)
      .neq("id", equipment.id)
      .eq("aktif", true)
      .limit(4);

    if (relatedData) {
      relatedEquipment = relatedData as EquipmentWithDetails[];
    }
  }

  const accent = getCategoryAccent(equipment.category?.ikon);
  const primaryImage =
    equipment.images?.find((img) => img.is_utama)?.url ||
    equipment.images?.[0]?.url ||
    null;

  const spesifikasiObj = equipment.spesifikasi as Record<
    string,
    string | number | boolean
  > | null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 pb-24 md:pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/alat" className="hover:text-primary transition-colors">
          Katalog Alat
        </Link>
        {equipment.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/kategori/${equipment.category.slug}`}
              className="hover:text-primary transition-colors truncate max-w-[120px]"
            >
              {equipment.category.nama}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-xs">
          {equipment.nama}
        </span>
      </nav>

      {/* Main Grid: Detail Alat & Widget Pemesanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Kolom Kiri: Galeri Foto, Deskripsi, Spesifikasi (8 Kolom di Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Galeri Gambar */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-muted/50 shadow-md">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={equipment.nama}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div
                  className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${accent.gradient} p-8 text-center`}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card/85 backdrop-blur-sm shadow-md border border-border/60 text-primary mb-3">
                    <Layers className="h-12 w-12" />
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {equipment.nama}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Foto produk akan segera diperbarui
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail gallery jika ada lebih dari 1 foto */}
            {equipment.images && equipment.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {equipment.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted cursor-pointer hover:border-primary transition-all"
                  >
                    <Image
                      src={img.url}
                      alt={equipment.nama}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Alat Utama */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {equipment.category && (
                <Link href={`/kategori/${equipment.category.slug}`}>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${accent.bg} ${accent.text} ${accent.border}`}
                  >
                    {equipment.category.nama}
                  </span>
                </Link>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Siap diambil hari ini
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {equipment.nama}
            </h1>

            {/* Deskripsi */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-2">
              <h2 className="text-base font-bold text-foreground">
                Deskripsi Perlengkapan
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {equipment.deskripsi ||
                  "Perlengkapan rental berkualitas dalam kondisi siap pakai. Telah melalui pengecekan fungsionalitas dan kebersihan sebelum diserahkan kepada penyewa."}
              </p>
            </div>

            {/* Spesifikasi Teknis (Jsonb objek kunci-nilai) */}
            {spesifikasiObj && Object.keys(spesifikasiObj).length > 0 && (
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-foreground">
                  Spesifikasi Teknis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(spesifikasiObj).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs"
                    >
                      <span className="font-semibold text-muted-foreground">
                        {formatSpecKey(key)}
                      </span>
                      <span className="font-bold text-foreground">
                        {typeof val === "boolean"
                          ? val
                            ? "Ya"
                            : "Tidak"
                          : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ketentuan Sewa & Keamanan */}
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Ketentuan & Jaminan Rental di {APP_NAME}
              </h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
                <li>
                  Deposit jaminan akan dikembalikan utuh saat alat diserahkan kembali dalam kondisi baik.
                </li>
                <li>
                  Pembayaran DP 30% mengunci ketersediaan unit untuk jadwal sewa yang Anda pilih.
                </li>
                <li>
                  Wajib membawa kartu identitas (KTP/SIM asli) saat serah terima alat.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rental Booking Widget (Sticky di Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24">
            <RentalBookingWidget
              equipment={equipment}
              defaultDpPersen={dpPersen}
            />
          </div>
        </div>
      </div>

      {/* Rekomendasi Alat Terkait */}
      {relatedEquipment.length > 0 && (
        <section className="pt-12 border-t border-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Alat Terkait di Kategori {equipment.category?.nama}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilihan lain yang mungkin Anda butuhkan untuk kegiatan serupa
              </p>
            </div>
            {equipment.category && (
              <Link
                href={`/kategori/${equipment.category.slug}`}
                className="text-xs font-bold text-primary hover:underline"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedEquipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
