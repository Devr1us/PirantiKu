"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  MessageCircle,
  Package,
  Layers,
} from "lucide-react";
import type { Category, EquipmentWithDetails } from "@/types/database";
import {
  getCategoryIcon,
  getCategoryDescription,
  normalizeAdminPhone,
} from "@/lib/constants";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import {
  Reveal,
  Stagger,
  StaggerItem,
  CountUp,
} from "@/components/ui/motion";
import { H1, H2, H3, Lead, P } from "@/components/ui/typography";
import { HoverRollText } from "@/components/ui/text-motion";

interface HomeViewProps {
  categories: Category[];
  newestEquipment?: EquipmentWithDetails[];
  categoryCounts: Record<number, number>;
  totalActiveTypes: number;
  totalAvailableUnits: number;
  whatsappAdmin: string;
  dpPersen: number;
  alamat?: string;
  jamOperasional?: string;
  mapsEmbedUrl?: string;
  lokasiLat?: number;
  lokasiLng?: number;
}

export function HomeView({
  categories,
  categoryCounts,
  totalActiveTypes,
  totalAvailableUnits,
  whatsappAdmin,
  dpPersen,
}: HomeViewProps) {
  const cleanWa = normalizeAdminPhone(whatsappAdmin);
  const effectiveDp = Number(dpPersen) > 0 ? Number(dpPersen) : 30;

  return (
    <div className="flex flex-col w-full bg-[#FAFAF8] text-[#234E5C]">
      {/* ========================================================
          1. HERO SECTION (Dua Kolom)
          ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="site-container">
          <div className="max-w-3xl space-y-6">
            <div className="space-y-2">
              <H1 hero>PIRANTIKU</H1>
              <H2 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-[#234E5C]">
                BOOKING ALAT SERBA ADA
              </H2>
            </div>

            <Lead>
              Booking dan reservasi alat lengkap untuk camping outdoor, pertukangan mandiri, olahraga, kebersihan rumah tangga, dan kebutuhan acara. Stok pasti per tanggal yang Anda pilih dengan uang muka (DP) mulai 30%.
            </Lead>

            <Reveal delay={0.25} className="pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/alat">
                  <Button variant="petrol" size="lg" className="px-8 text-sm uppercase tracking-wider font-bold">
                    <HoverRollText text="LIHAT KATALOG" />
                  </Button>
                </Link>

                <a
                  href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="warm" size="lg" className="px-8 text-sm uppercase tracking-wider font-bold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <HoverRollText text="HUBUNGI ADMIN" />
                  </Button>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. KATEGORI ALAT (Wadah Besar --panel berisi Kartu Putih)
          ======================================================== */}
      <section className="py-12 md:py-20">
        <div className="site-container">
          <div className="rounded-[40px] bg-[#F3F3EF] p-6 sm:p-10 md:p-14 space-y-10 border border-[#E8E8E1]">
            <div className="space-y-2">
              <H2>KATEGORI ALAT</H2>
              <Lead className="text-base text-[#5F7A84] font-bold">
                Pilihan perlengkapan lengkap siap booking sesuai kebutuhan aktivitas Anda.
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
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Kolom Kiri: Teks Konkret dan Jujur */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <H2>TENTANG PIRANTIKU</H2>
                <H3>
                  Booking alat dengan sistem yang jelas dan transparan.
                </H3>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#234E5C] leading-relaxed">
                <P>
                  PirantiKu hadir untuk memudahkan masyarakat, pekerja lapangan, dan komunitas mendapatkan akses perlengkapan berkualitas tanpa harus membeli unit baru. Kami beroperasi dengan sistem <strong>booking per tanggal</strong> yang terintegrasi langsung dengan penghitungan sisa unit secara real-time.
                </P>
                <P delay={0.08}>
                  Setiap alat yang masuk dan keluar selalu melalui prosedur pembersihan dan <strong>uji fungsi kelayakan</strong>. Untuk menjamin kepastian jadwal, Anda cukup membayar <strong>uang muka (DP) {effectiveDp}%</strong> saat pemesanan online.
                </P>
                <P delay={0.16}>
                  Pelunasan sisa biaya booking beserta <strong>deposit jaminan</strong> dilakukan saat serah terima unit di lokasi kami. Setelah masa booking selesai dan alat dikembalikan dalam keadaan baik sesuai ketentuan, deposit Anda akan <strong>langsung dikembalikan penuh</strong>.
                </P>
              </div>
            </div>

            {/* Kolom Kanan: Foto slot Tentang PirantiKu */}
            <Reveal delay={0.1} className="lg:col-span-5">
              <div className="relative aspect-[4/3] sm:aspect-[1/1] w-full rounded-2xl overflow-hidden border border-[#E8E8E1] bg-[#F5F3EB] shadow-sm flex items-center justify-center p-6 text-center">
                <SafeImage
                  src="/images/TentangPirantiKu.png"
                  alt="Tentang PirantiKu"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  fallback={
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
                  }
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. STRIP STATISTIK (Empat Kotak Bergaris Tipis)
          ======================================================== */}
      <section className="py-8 md:py-16">
        <div className="site-container">
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
                  Total Unit Siap Booking
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
                  <CountUp value={effectiveDp} suffix="%" />
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
          5. KARTU CTA WADAH RAPI MODERN (DI ATAS FOOTER)
          ======================================================== */}
      <section className="w-full py-16 sm:py-24 bg-[#FAFAF8]">
        <div className="site-container">
          <Reveal>
            <div className="rounded-[28px] sm:rounded-[36px] border border-[#234E5C]/20 bg-white p-8 sm:p-14 md:p-16 text-center space-y-6 shadow-xs">
              {/* Pill Badge Centered */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F4F7] border border-[#234E5C]/20 text-[#234E5C] text-xs font-semibold">
                <Package className="h-3.5 w-3.5" />
                <span>Mulai Booking Dalam 2 Menit</span>
              </div>

              {/* Judul Besar Sesuai Layout Referensi */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#234E5C] max-w-3xl mx-auto leading-tight">
                Siap Booking Perlengkapan &amp; Melipatgandakan Kelancaran Acara Anda?
              </h2>

              {/* Teks Pendukung */}
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#5F7A84] leading-relaxed">
                Pilih perlengkapan yang Anda butuhkan tanpa ribet. Booking langsung per tanggal, amankan unit dengan DP fleksibel {effectiveDp}%, dan nikmati alat terawat siap pakai untuk segala kebutuhan aktivitas Anda.
              </p>

              {/* Tombol Aksi Utama (Warna Dominan Petrol #234E5C) */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link href="/alat">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#234E5C] hover:bg-[#1B3E49] active:scale-[0.98] text-white text-sm sm:text-base font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <span>Lihat Katalog Alat Sekarang &mdash; Siap Pakai &rarr;</span>
                  </button>
                </Link>

                <a
                  href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-[#E8E8E1] text-[#234E5C] text-sm font-bold flex items-center gap-2 hover:bg-[#FAFAF8]"
                  >
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    <span>Hubungi Admin WhatsApp</span>
                  </Button>
                </a>
              </div>

              {/* Poin Kepercayaan dengan Centang (Trust Checkmarks) */}
              <div className="pt-2 text-xs sm:text-sm text-[#5F7A84] flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <span>&check; Jaminan stok pasti per tanggal. Cukup KTP / SIM fisik saat serah terima.</span>
                <span>&check; Deposit jaminan kembali utuh 100% tanpa potongan tersembunyi.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
