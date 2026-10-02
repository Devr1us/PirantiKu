"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowRight,
  MessageCircle,
  MapPin,
  Clock,
  Package,
  Layers,
} from "lucide-react";
import type { Category, EquipmentWithDetails } from "@/types/database";
import {
  getCategoryIcon,
  getCategoryDescription,
} from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  AnimatedText,
  Reveal,
  Stagger,
  StaggerItem,
  CountUp,
} from "@/components/ui/motion";
import { H1, H2, H3, Lead, P } from "@/components/ui/typography";
import { HoverRollText } from "@/components/ui/text-motion";

interface HomeViewProps {
  categories: Category[];
  newestEquipment: EquipmentWithDetails[];
  categoryCounts: Record<number, number>;
  totalActiveTypes: number;
  totalAvailableUnits: number;
  whatsappAdmin: string;
  dpPersen: number;
  alamat: string;
  jamOperasional: string;
  mapsEmbedUrl: string;
}

export function HomeView({
  categories,
  newestEquipment,
  categoryCounts,
  totalActiveTypes,
  totalAvailableUnits,
  whatsappAdmin,
  dpPersen,
  alamat,
  jamOperasional,
  mapsEmbedUrl,
}: HomeViewProps) {
  const cleanWa = whatsappAdmin.replace(/[^0-9]/g, "");
  const [tentangImgError, setTentangImgError] = React.useState(false);

  return (
    <div className="flex flex-col w-full bg-[#FAFAF8] text-[#234E5C]">
      {/* ========================================================
          1. HERO SECTION (Dua Kolom)
          ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Kolom Kiri: Judul, Sub-judul, Deskripsi, Tombol Aksi */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <H1 hero>PIRANTIKU</H1>
                <H2 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-[#234E5C]">
                  SEWA ALAT SERBA ADA
                </H2>
              </div>

              <Lead>
                Penyewaan alat lengkap untuk camping outdoor, pertukangan mandiri, olahraga, kebersihan rumah tangga, dan kebutuhan acara. Stok pasti per tanggal yang Anda pilih dengan uang muka (DP) mulai {dpPersen}%.
              </Lead>

              <Reveal delay={0.25} className="pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/alat">
                    <Button variant="petrol" size="lg" className="px-8 text-sm uppercase tracking-wider font-bold">
                      <HoverRollText text="LIHAT KATALOG" />
                    </Button>
                  </Link>

                  <a
                    href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20sewa%20alat`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="warm" size="lg" className="px-8 text-sm uppercase tracking-wider font-bold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <HoverRollText text="CHAT ADMIN" />
                    </Button>
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Kolom Kanan: Ilustrasi Vektor Datar Buatan Sendiri */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [-3, 3, -3],
                }}
                transition={{
                  opacity: { duration: 0.5, ease: "easeOut" },
                  scale: { duration: 0.5, ease: "easeOut" },
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative w-full max-w-[420px] aspect-square rounded-full border border-[#E8E8E1] bg-[#F3F3EF] p-4 flex items-center justify-center shadow-sm"
              >
                <Image
                  src="/images/hero-illustration.svg"
                  alt="Ilustrasi PirantiKu"
                  width={420}
                  height={420}
                  priority
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. KATEGORI ALAT (Wadah Besar --panel berisi Kartu Putih)
          ======================================================== */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[40px] bg-[#F3F3EF] p-6 sm:p-10 md:p-14 space-y-10 border border-[#E8E8E1]">
            <div className="space-y-2">
              <H2>KATEGORI ALAT</H2>
              <Lead className="text-base text-[#5F7A84] font-bold">
                Pilihan perlengkapan lengkap siap sewa sesuai kebutuhan aktivitas Anda.
              </Lead>
            </div>

            {/* Grid Kartu Putih */}
            <Stagger
              staggerDelay={0.06}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.ikon);
                const count = categoryCounts[cat.id] || 0;
                const desc = getCategoryDescription(cat.slug);

                return (
                  <StaggerItem key={cat.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col justify-between h-full bg-white border border-[#E8E8E1] rounded-xl p-6 transition-shadow hover:shadow-md"
                    >
                      <div className="space-y-4">
                        <div className="text-[#234E5C]">
                          <IconComponent className="h-10 w-10 stroke-[1.8]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#2E5E4E]">
                            {cat.nama}
                          </h3>
                          <p className="text-xs text-[#5F7A84] mt-1.5 leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#E8E8E1] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#5F7A84]">
                          {count} alat aktif
                        </span>
                        <Link href={`/kategori/${cat.slug}`}>
                          <Button variant="warm" size="sm" className="text-xs px-4 h-8 font-bold">
                            Lihat Alat
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}

              {/* Kartu Terakhir: Semua Alat */}
              <StaggerItem>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col justify-between h-full bg-white border border-[#E8E8E1] rounded-xl p-6 transition-shadow hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div className="text-[#234E5C]">
                      <Layers className="h-10 w-10 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#2E5E4E]">
                        Semua Alat
                      </h3>
                      <p className="text-xs text-[#5F7A84] mt-1.5 leading-relaxed">
                        Jelajahi seluruh inventaris perlengkapan dan perkakas yang tersedia di PirantiKu.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8E8E1] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5F7A84]">
                      {totalActiveTypes} macam alat
                    </span>
                    <Link href="/alat">
                      <Button variant="warm" size="sm" className="text-xs px-4 h-8 font-bold">
                        Buka Katalog
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. TENTANG PIRANTIKU (Dua Kolom: Teks Jujur & Gambar/Slot)
          ======================================================== */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Kolom Kiri: Teks Konkret dan Jujur */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <H2>TENTANG PIRANTIKU</H2>
                <H3>
                  Penyewaan alat dengan sistem yang jelas dan transparan.
                </H3>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#234E5C] leading-relaxed">
                <P>
                  PirantiKu hadir untuk memudahkan masyarakat, pekerja lapangan, dan komunitas mendapatkan akses perlengkapan berkualitas tanpa harus membeli unit baru. Kami beroperasi dengan sistem <strong>sewa per tanggal</strong> yang terintegrasi langsung dengan penghitungan sisa unit secara real-time.
                </P>
                <P delay={0.08}>
                  Setiap alat yang masuk dan keluar selalu melalui prosedur pembersihan dan <strong>uji fungsi kelayakan</strong>. Untuk menjamin kepastian jadwal, Anda cukup membayar <strong>uang muka (DP) {dpPersen}%</strong> saat pemesanan online.
                </P>
                <P delay={0.16}>
                  Pelunasan sisa biaya sewa beserta <strong>deposit jaminan</strong> dilakukan saat serah terima unit di lokasi kami. Setelah masa sewa selesai dan alat dikembalikan dalam keadaan baik sesuai ketentuan, deposit Anda akan <strong>langsung dikembalikan penuh</strong>.
                </P>
              </div>
            </div>

            {/* Kolom Kanan: Foto slot public/images/tentang.jpg dengan placeholder datar */}
            <Reveal delay={0.1} className="lg:col-span-5">
              <div className="relative aspect-[4/3] sm:aspect-[1/1] w-full rounded-2xl overflow-hidden border border-[#E8E8E1] bg-[#F5F3EB] shadow-sm flex items-center justify-center p-6 text-center">
                {!tentangImgError ? (
                  <Image
                    src="/images/tentang.jpg"
                    alt="Operasional PirantiKu"
                    fill
                    className="object-cover"
                    onError={() => setTentangImgError(true)}
                  />
                ) : null}

                {/* Flat Placeholder jika tentang.jpg belum ada */}
                {tentangImgError && (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-[#E8E8E1] text-[#234E5C]">
                      <Package className="h-8 w-8 stroke-[1.8]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#234E5C]">
                        Gudang & Workshop PirantiKu
                      </p>
                      <p className="text-xs text-[#5F7A84] mt-1 max-w-xs">
                        Pemeriksaan ketat dan perawatan rutin untuk memastikan alat selalu siap dipakai.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. STRIP STATISTIK (Empat Kotak Bergaris Tipis)
          ======================================================== */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <Stagger
            staggerDelay={0.06}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#234E5C]">
                  <CountUp value={totalActiveTypes} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5F7A84]">
                  Jenis Alat Aktif
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#234E5C]">
                  <CountUp value={totalAvailableUnits} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5F7A84]">
                  Total Unit Siap Sewa
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#234E5C]">
                  <CountUp value={categories.length} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5F7A84]">
                  Kategori Pilihan
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#A0630F]">
                  <CountUp value={dpPersen} suffix="%" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5F7A84]">
                  DP Ringan Mulai
                </p>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ========================================================
          5. PILIHAN ALAT (6 Alat Terbaru dari Database)
          ======================================================== */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <H2>PILIHAN ALAT</H2>
              <Lead className="text-sm text-[#5F7A84] font-semibold mt-1">
                Perlengkapan terbaru yang siap disewa hari ini.
              </Lead>
            </div>
            <Link
              href="/alat"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#A0630F] hover:underline uppercase tracking-wide group"
            >
              Lihat semua alat
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Baris Kartu Foto Persegi (Desktop Grid 3 atau 6, Mobile horizontal snap) */}
          <div className="overflow-x-auto pb-4 pt-1 snap-x snap-mandatory flex gap-5 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:overflow-visible">
            {newestEquipment.map((item, index) => {
              const primaryImage =
                item.images?.find((img) => img.is_utama)?.url ||
                item.images?.[0]?.url ||
                null;
              const IconComp = getCategoryIcon(item.category?.ikon);
              const delay = (index % 6) * 0.05;

              return (
                <Reveal
                  key={item.id}
                  delay={delay}
                  duration={0.35}
                  className="min-w-[220px] sm:min-w-[240px] md:min-w-0 snap-start flex flex-col justify-between rounded-2xl border border-[#E8E8E1] bg-white p-3 hover:shadow-md transition-all group"
                >
                  <Link href={`/alat/${item.slug}`} className="block space-y-3">
                    {/* Foto Persegi rounded-2xl dengan overflow hidden dan hover zoom 1.04 */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#F5F3EB] border border-[#E8E8E1]/60">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={item.nama}
                          fill
                          sizes="(max-width: 768px) 240px, 200px"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full p-4 text-[#234E5C]">
                          <IconComp className="h-10 w-10 stroke-[1.8]" />
                          <span className="text-[10px] text-[#5F7A84] mt-2 font-medium">
                            {item.category?.nama || "Peralatan"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 px-1">
                      <span className="text-[11px] font-semibold text-[#5F7A84] block truncate">
                        {item.category?.nama || "Alat"}
                      </span>
                      <h3 className="text-sm font-bold text-[#234E5C] line-clamp-1 group-hover:text-[#A0630F] transition-colors">
                        {item.nama}
                      </h3>
                      <p className="text-sm font-bold text-[#A0630F] pt-1">
                        {formatRupiah(item.harga_per_hari)}{" "}
                        <span className="text-xs font-normal text-[#5F7A84]">/ hari</span>
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. CARA SEWA (id="cara-sewa", 3 Langkah Bernomor Besar)
          ======================================================== */}
      <section id="cara-sewa" className="py-12 md:py-20 scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-2">
            <H2>CARA SEWA</H2>
            <Lead className="text-base text-[#5F7A84] font-bold">
              Tiga langkah praktis untuk meminjam peralatan kebutuhan Anda.
            </Lead>
          </div>

          <Stagger
            staggerDelay={0.08}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Langkah 1 */}
            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-8 space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#234E5C] leading-none block">
                    01
                  </span>
                  <h3 className="text-lg font-bold text-[#234E5C]">
                    Pilih alat dan tanggal
                  </h3>
                  <p className="text-sm text-[#5F7A84] leading-relaxed">
                    Jelajahi katalog dan pilih perlengkapan yang Anda perlukan. Tentukan tanggal mulai dan selesai peminjaman untuk melihat sisa stok yang tersedia secara real-time.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Langkah 2 */}
            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-8 space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#A0630F] leading-none block">
                    02
                  </span>
                  <h3 className="text-lg font-bold text-[#234E5C]">
                    Booking dan bayar DP
                  </h3>
                  <p className="text-sm text-[#5F7A84] leading-relaxed">
                    Kunci unit alat pesanan Anda dengan membayar uang muka (DP) {dpPersen}% via transfer bank atau QRIS. Admin akan segera memverifikasi pesanan Anda.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Langkah 3 */}
            <StaggerItem>
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-8 space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#2E5E4E] leading-none block">
                    03
                  </span>
                  <h3 className="text-lg font-bold text-[#234E5C]">
                    Ambil alat, pakai, lalu kembalikan
                  </h3>
                  <p className="text-sm text-[#5F7A84] leading-relaxed">
                    Ambil unit di toko kami, selesaikan pelunasan serta deposit jaminan, gunakan alat dengan baik, dan kembalikan tepat waktu untuk pencairan kembali deposit Anda.
                  </p>
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ========================================================
          7. LOKASI & KONTAK (id="kontak")
          ======================================================== */}
      <section id="kontak" className="py-12 md:py-20 scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2">
            <H2>LOKASI & KONTAK</H2>
            <Lead className="text-base text-[#5F7A84] font-bold">
              Kunjungi toko kami atau hubungi nomor layanan untuk konsultasi sewa.
            </Lead>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Informasi Alamat & Jam Kerja */}
            <Reveal delay={0.05} className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E8E8E1] rounded-xl p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F3EF] text-[#234E5C] shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                      Alamat Pengambilan Alat
                    </h3>
                    <p className="text-sm font-semibold text-[#234E5C] mt-1 leading-relaxed">
                      {alamat || "Jl. Raya Rental No. 12, Jakarta"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-[#E8E8E1] pt-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F3EF] text-[#234E5C] shrink-0 mt-0.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                      Jam Operasional
                    </h3>
                    <p className="text-sm font-semibold text-[#234E5C] mt-1 leading-relaxed">
                      {jamOperasional || "Senin - Minggu: 08.00 - 21.00 WIB"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-[#E8E8E1] pt-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F3EF] text-[#234E5C] shrink-0 mt-0.5">
                    <MessageCircle className="h-5 w-5 text-[#A0630F]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                      WhatsApp Pelayanan
                    </h3>
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[#A0630F] hover:underline mt-1 block"
                    >
                      +{cleanWa}
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Google Maps Embed Iframe - with once: true so it never reloads */}
            <Reveal once={true} delay={0.1} className="lg:col-span-7">
              {mapsEmbedUrl ? (
                <div className="w-full h-[320px] sm:h-[380px] rounded-xl overflow-hidden border border-[#E8E8E1] bg-white shadow-sm">
                  <iframe
                    src={mapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Lokasi Toko PirantiKu"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-full h-[320px] rounded-xl border border-[#E8E8E1] bg-[#F3F3EF] flex flex-col items-center justify-center p-6 text-center">
                  <MapPin className="h-10 w-10 text-[#5F7A84] mb-2" />
                  <p className="text-sm font-bold text-[#234E5C]">
                    Peta Lokasi
                  </p>
                  <p className="text-xs text-[#5F7A84] mt-1 max-w-sm">
                    Toko kami berlokasi di {alamat || "Jakarta"}. Silakan hubungi WhatsApp kami untuk panduan rute atau petunjuk arah.
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. BAND CTA LEBAR PENUH BERLATAR PETROL
          ======================================================== */}
      <section className="w-full bg-[#234E5C] text-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <H2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
            SIAP SEWA ALAT?
          </H2>

          <P className="max-w-2xl mx-auto text-base sm:text-lg text-white/90 leading-relaxed font-normal">
            Pilih perlengkapan yang Anda butuhkan sekarang atau hubungi staf kami untuk ketersediaan alat dalam jumlah besar.
          </P>

          <Reveal delay={0.15}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/alat">
                <Button variant="warm" size="lg" className="px-8 text-sm uppercase tracking-wider font-bold">
                  <HoverRollText text="LIHAT KATALOG" />
                </Button>
              </Link>

              <a
                href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20sewa%20alat`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="warm"
                  size="lg"
                  className="px-8 text-sm uppercase tracking-wider font-bold flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <HoverRollText text="CHAT ADMIN" />
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
