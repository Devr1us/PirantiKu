"use client";

import * as React from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Category, EquipmentWithDetails } from "@/types/database";
import { normalizeAdminPhone } from "@/lib/constants";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/ui/motion";
import { H2, H3, P } from "@/components/ui/typography";
import { HeroSection } from "./hero-section";
import { CategorySection } from "./category-section";

export interface HomeViewProps {
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
    <div className="flex flex-col w-full bg-[var(--bg-base)] text-[var(--text-main)]">
      {/* ========================================================
          1. HERO SECTION (1 Layar Penuh + Dua Kolom + Nota Booking)
          ======================================================== */}
      <HeroSection
        totalActiveTypes={totalActiveTypes}
        whatsappAdmin={whatsappAdmin}
        dpPersen={dpPersen}
      />

      {/* ========================================================
          2. KATEGORI ALAT (Section Terpisah di Bawah Hero, Latar Putih)
          ======================================================== */}
      <CategorySection
        categories={categories}
        categoryCounts={categoryCounts}
        totalActiveTypes={totalActiveTypes}
      />

      {/* ========================================================
          3. TENTANG PIRANTIKU (Dua Kolom: Teks Jujur & Gambar Workshop)
          ======================================================== */}
      <section className="py-16 md:py-24 bg-[var(--bg-sage)] text-[var(--text-main)]">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Kolom Kiri: Teks Konkret dan Jujur */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <H2 className="text-[var(--bg-dark)]">TENTANG PIRANTIKU</H2>
                <H3 className="text-[var(--text-main)]">
                  Booking alat dengan sistem yang jelas dan transparan.
                </H3>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
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
              <div className="relative aspect-[4/3] sm:aspect-[1/1] w-full rounded-3xl overflow-hidden border border-[var(--border-soft)] bg-white shadow-md flex items-center justify-center p-6 text-center">
                <SafeImage
                  src="/images/TentangPirantiKu.png"
                  alt="Tentang PirantiKu"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  fallback={
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-[var(--bg-dark)]">
                        <Package className="h-8 w-8 stroke-[1.8]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--bg-dark)]">
                          Gudang &amp; Workshop PirantiKu
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
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
      <section className="py-12 md:py-16 bg-white border-y border-[var(--border-soft)]">
        <div className="site-container">
          <Stagger
            staggerDelay={0.06}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            <StaggerItem>
              <div className="bg-[var(--bg-base)] border border-[var(--border-soft)] rounded-2xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--bg-dark)]">
                  <CountUp value={totalActiveTypes} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Jenis Alat Aktif
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-[var(--bg-base)] border border-[var(--border-soft)] rounded-2xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--bg-dark)]">
                  <CountUp value={totalAvailableUnits} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Total Unit Siap Booking
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-[var(--bg-base)] border border-[var(--border-soft)] rounded-2xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--bg-dark)]">
                  <CountUp value={categories.length} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Kategori Pilihan
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-[var(--bg-base)] border border-[var(--border-soft)] rounded-2xl p-6 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--bg-dark)]">
                  <CountUp value={effectiveDp} suffix="%" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
      <section className="w-full py-16 sm:py-24 bg-[var(--bg-base)]">
        <div className="site-container">
          <Reveal>
            <div className="rounded-[32px] sm:rounded-[40px] border border-[var(--bg-footer)] bg-[var(--bg-dark)] p-8 sm:p-14 md:p-16 text-center space-y-6 shadow-xl text-white">
              {/* Pill Badge Centered */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[var(--accent-gold)] text-xs font-bold uppercase tracking-wider">
                <Package className="h-3.5 w-3.5" />
                <span>Mulai Booking Dalam 2 Menit</span>
              </div>

              {/* Judul Besar Sesuai Layout Referensi */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
                Siap Booking Perlengkapan &amp; Melipatgandakan Kelancaran Acara Anda?
              </h2>

              {/* Teks Pendukung */}
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/85 leading-relaxed">
                Pilih perlengkapan yang Anda butuhkan tanpa ribet. Booking langsung per tanggal, amankan unit dengan DP fleksibel {effectiveDp}%, dan nikmati alat terawat siap pakai untuk segala kebutuhan aktivitas Anda.
              </p>

              {/* Tombol Aksi Utama */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link href="/alat">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--accent-gold)] hover:bg-[#E0A82E] text-[var(--bg-dark)] text-sm sm:text-base font-bold shadow-[4px_4px_0_var(--bg-footer)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--bg-footer)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 cursor-pointer"
                  >
                    <span>Lihat Katalog Alat →</span>
                  </button>
                </Link>

                <a
                  href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-12 px-7 rounded-2xl border-2 border-white text-white text-sm sm:text-base font-bold hover:bg-white/10 shadow-[4px_4px_0_var(--bg-footer)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--bg-footer)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 cursor-pointer"
                  >
                    <span>Hubungi Admin</span>
                  </button>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
