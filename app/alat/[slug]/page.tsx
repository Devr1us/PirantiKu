import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatSpecKey } from "@/lib/format";
import { APP_NAME, getCategoryIcon } from "@/lib/constants";
import type { EquipmentWithDetails } from "@/types/database";
import { RentalBookingWidget } from "@/components/equipment/rental-booking-widget";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { H1, H2, H3, Lead, P } from "@/components/ui/typography";

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

  const primaryImage =
    equipment.images?.find((img) => img.is_utama)?.url ||
    equipment.images?.[0]?.url ||
    null;

  const spesifikasiObj = equipment.spesifikasi as Record<
    string,
    string | number | boolean
  > | null;

  const IconComp = getCategoryIcon(equipment.category?.ikon);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-24 md:pb-12 bg-[#FAFAF8] text-[#234E5C]">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#5F7A84]">
        <Link href="/" className="hover:text-[#234E5C] transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#5F7A84]" />
        <Link href="/alat" className="hover:text-[#234E5C] transition-colors">
          Katalog
        </Link>
        {equipment.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#5F7A84]" />
            <Link
              href={`/kategori/${equipment.category.slug}`}
              className="hover:text-[#234E5C] transition-colors truncate max-w-[120px]"
            >
              {equipment.category.nama}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-[#5F7A84]" />
        <span className="font-bold text-[#234E5C] truncate max-w-[160px] sm:max-w-xs">
          {equipment.nama}
        </span>
      </nav>

      {/* Header Halaman Spesifik Alat */}
      <div className="space-y-1.5 border-b border-[#E8E8E1] pb-5">
        <H1 className="section-title block">
          {equipment.nama.toUpperCase()}
        </H1>
        <Lead className="text-sm sm:text-base text-[#5F7A84] font-medium">
          Kategori {equipment.category?.nama || "Peralatan"} &bull; Unit siap diambil dan digunakan sesuai tanggal yang Anda tentukan.
        </Lead>
      </div>

      {/* Grid: Detail & Widget Pemesanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Kolom Kiri: Galeri Foto, Deskripsi, Spesifikasi */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Galeri Gambar: rounded-2xl */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E8E8E1] bg-[#F5F3EB] shadow-sm">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={equipment.nama}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-[#234E5C]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-[#E8E8E1] text-[#234E5C] mb-3">
                    <IconComp className="h-10 w-10 stroke-[1.8]" />
                  </div>
                  <span className="text-sm font-bold text-[#234E5C]">
                    {equipment.nama}
                  </span>
                  <span className="text-xs text-[#5F7A84] mt-1">
                    Foto produk akan diperbarui oleh pengelola
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail jika ada lebih dari 1 foto */}
            {equipment.images && equipment.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {equipment.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E8E8E1] bg-[#F5F3EB] cursor-pointer hover:border-[#234E5C] transition-all"
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

          {/* Informasi Detail */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {equipment.category && (
                <Link href={`/kategori/${equipment.category.slug}`}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B2F5EA] bg-[#E6FFFA] px-3 py-1 text-xs font-bold text-[#234E5C]">
                    {equipment.category.nama}
                  </span>
                </Link>
              )}
              <span className="text-xs text-[#5F7A84] flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5 text-[#234E5C]" />
                Pengecekan fungsi sebelum serah terima
              </span>
            </div>

            {/* Deskripsi dalam Kartu Putih */}
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-2">
              <h2 className="text-base font-bold text-[#234E5C]">
                Deskripsi Perlengkapan
              </h2>
              <p className="text-sm text-[#234E5C] leading-relaxed whitespace-pre-line">
                {equipment.deskripsi ||
                  "Perlengkapan rental berkualitas dalam kondisi siap pakai. Telah melalui pengecekan fungsionalitas dan kebersihan sebelum diserahkan kepada penyewa."}
              </p>
            </div>

            {/* Spesifikasi Teknis */}
            {spesifikasiObj && Object.keys(spesifikasiObj).length > 0 && (
              <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#234E5C]">
                  Spesifikasi Teknis
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(spesifikasiObj).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] text-xs"
                    >
                      <span className="font-semibold text-[#5F7A84]">
                        {formatSpecKey(key)}
                      </span>
                      <span className="font-bold text-[#234E5C]">
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

            {/* Ketentuan Sewa */}
            <div className="rounded-xl border border-[#E8E8E1] bg-[#F3F3EF] p-6 space-y-3">
              <h3 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#234E5C]" />
                Ketentuan & Jaminan Rental di {APP_NAME}
              </h3>
              <ul className="space-y-2 text-xs text-[#5F7A84] leading-relaxed list-disc list-inside">
                <li>
                  Deposit jaminan akan dikembalikan utuh saat alat diserahkan kembali dalam kondisi baik.
                </li>
                <li>
                  Pembayaran DP {dpPersen}% mengunci ketersediaan unit untuk jadwal sewa yang Anda pilih.
                </li>
                <li>
                  Wajib membawa kartu identitas (KTP/SIM asli) saat serah terima alat di toko.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rental Booking Widget */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-[var(--navbar-offset)] transition-[top] duration-300">
            <RentalBookingWidget
              equipment={equipment}
              defaultDpPersen={dpPersen}
            />
          </div>
        </div>
      </div>

      {/* Rekomendasi Alat Terkait */}
      {relatedEquipment.length > 0 && (
        <section className="pt-12 border-t border-[#E8E8E1] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[#234E5C]">
                Alat Terkait di Kategori {equipment.category?.nama}
              </h3>
              <p className="text-xs text-[#5F7A84] mt-0.5">
                Pilihan lain yang mungkin Anda butuhkan untuk kegiatan serupa
              </p>
            </div>
            {equipment.category && (
              <Link
                href={`/kategori/${equipment.category.slug}`}
                className="text-xs font-bold text-[#A0630F] hover:underline uppercase"
              >
                Lihat Semua &rarr;
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
