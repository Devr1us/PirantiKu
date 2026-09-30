"use client";

import * as React from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CalendarCheck,
  CheckCircle2,
  PhoneCall,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { Category, EquipmentWithDetails } from "@/types/database";
import { APP_NAME, getCategoryIcon, getCategoryAccent } from "@/lib/constants";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { SearchHero } from "@/components/equipment/search-hero";
import { Button } from "@/components/ui/button";

interface HomeViewProps {
  categories: Category[];
  popularEquipment: EquipmentWithDetails[];
  whatsappAdmin: string;
}

export function HomeView({
  categories,
  popularEquipment,
  whatsappAdmin,
}: HomeViewProps) {
  const cleanWa = whatsappAdmin.replace(/[^0-9]/g, "");

  // Variasi animasi
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const staggerGrid: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const steps = [
    {
      num: "01",
      title: "Pilih Alat & Jadwal",
      desc: "Cari alat yang Anda butuhkan, tentukan rentang tanggal sewa, dan sistem kami langsung mengecek stok ketersediaan secara real-time.",
      icon: CalendarCheck,
    },
    {
      num: "02",
      title: "Bayar DP & Konfirmasi",
      desc: "Cukup bayar DP 30% via transfer bank atau QRIS. Setelah diverifikasi admin, pesanan alat resmi terkunci untuk Anda.",
      icon: Zap,
    },
    {
      num: "03",
      title: "Ambil & Siap Pakai",
      desc: "Ambil alat di toko atau gunakan opsi pengantaran. Lunasi sisa pembayaran dan deposit, alat siap menunjang kegiatan Anda.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Latar Belakang Dekoratif Blur */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/2 -right-40 w-[400px] h-[300px] bg-accent-warm/10 blur-[100px] rounded-full" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Pill Tagline */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Rental Alat Serba Ada & Terpercaya</span>
            </motion.div>

            {/* Judul Utama dengan Animasi Reveal */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-4xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-[1.15]"
            >
              Sewa Alat Praktis, Mudah &{" "}
              <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                Pasti Tersedia
              </span>{" "}
              Saat Dibutuhkan
            </motion.h1>

            {/* Subjudul Fade-Up */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              Tenda camping, perkakas pertukangan, alat olahraga, perlengkapan kebersihan, hingga acara pesta.
              Stok transparan real-time dengan DP ringan mulai 30%.
            </motion.p>

            {/* Bilah Pencarian Interaktif */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full pt-4"
            >
              <SearchHero categories={categories} />
            </motion.div>

            {/* Value Proposition Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-3xl w-full text-left"
            >
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Stok Real-Time</h4>
                  <p className="text-[11px] text-muted-foreground">Ketersediaan akurat per tanggal</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-warm/15 text-accent-warm shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">DP Ringan 30%</h4>
                  <p className="text-[11px] text-muted-foreground">Sisa dilunasi saat serah terima</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Kondisi Prima</h4>
                  <p className="text-[11px] text-muted-foreground">Pembersihan & uji fungsi rutin</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. KATEGORI ALAT DARI DATABASE */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Eksplorasi Lengkap
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                Pilih Berdasarkan Kategori
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Temukan alat yang tepat untuk kegiatan proyek atau petualangan Anda
              </p>
            </div>
            <Link
              href="/alat"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline underline-offset-4 group"
            >
              Lihat Semua Alat
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Grid Kategori */}
          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
          >
            {categories.map((cat) => {
              const IconComp = getCategoryIcon(cat.ikon);
              const accent = getCategoryAccent(cat.ikon);

              return (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Link
                    href={`/kategori/${cat.slug}`}
                    className="group relative flex flex-col items-center text-center p-6 rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                  >
                    <div
                      className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.gradient} p-4 transition-transform duration-300 group-hover:scale-110 shadow-sm`}
                    >
                      <IconComp className={`h-8 w-8 sm:h-10 sm:w-10 ${accent.text}`} />
                    </div>
                    <h3 className="mt-4 text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {cat.nama}
                    </h3>
                    <span className="mt-1 text-[11px] text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                      Lihat Alat
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 3. ALAT POPULER DARI DATABASE */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent-warm">
                Paling Sering Disewa
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                Rekomendasi Alat Populer
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Alat terbaik dengan permintaan tertinggi siap dipesan sekarang
              </p>
            </div>
            <Link href="/alat">
              <Button variant="outline" className="rounded-2xl font-semibold">
                Buka Katalog Lengkap
              </Button>
            </Link>
          </div>

          {popularEquipment.length > 0 ? (
            <motion.div
              variants={staggerGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {popularEquipment.map((item, idx) => (
                <motion.div key={item.id} variants={fadeInUp}>
                  <EquipmentCard equipment={item} priority={idx < 4} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border bg-card">
              <Layers className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold text-foreground">
                Belum ada alat yang ditampilkan
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Katalog alat sedang diperbarui oleh administrator. Silakan cek kembali nanti.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. CARA KERJA 3 LANGKAH */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Proses Cepat & Praktis
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Cara Sewa Alat di {APP_NAME}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tiga langkah mudah untuk mendapatkan alat berkualitas tanpa ribet
            </p>
          </div>

          <motion.div
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  variants={fadeInUp}
                  className="relative flex flex-col p-8 rounded-3xl border border-border bg-card shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <StepIcon className="h-7 w-7" />
                    </div>
                    <span className="text-4xl font-extrabold text-muted/60 font-mono">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 5. CALL TO ACTION (CTA) UTAMA */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-warm via-orange-600 to-amber-600 p-8 sm:p-12 md:p-16 text-white shadow-2xl shadow-accent-warm/20"
          >
            {/* Latar Belakang Lingkaran Halus */}
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute left-10 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-xl" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                Mulai Sekarang
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Punya Acara atau Proyek Mendadak? Kami Siap Bantu!
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                Pilih alat yang Anda butuhkan hari ini dan amankan jadwalnya sebelum kehabisan slot.
                Konsultasikan kebutuhan spesifik Anda dengan admin kami.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/alat">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-2xl h-12 px-8 font-bold bg-white text-orange-600 hover:bg-slate-100 shadow-lg shadow-black/10 active:scale-95"
                  >
                    Jelajahi Semua Alat
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>

                <a
                  href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20${encodeURIComponent(
                    APP_NAME
                  )},%20saya%20ingin%20tanya%20seputar%20sewa%20alat`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto rounded-2xl h-12 px-6 font-bold bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md active:scale-95"
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Hubungi WhatsApp Admin
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
