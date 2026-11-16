"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { BookingReceiptCard } from "./booking-receipt-card";
import { normalizeAdminPhone } from "@/lib/constants";

interface HeroSectionProps {
  totalActiveTypes?: number;
  whatsappAdmin: string;
  dpPersen?: number;
}

export function HeroSection({
  totalActiveTypes = 34,
  whatsappAdmin,
  dpPersen = 30,
}: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const cleanWa = normalizeAdminPhone(whatsappAdmin);
  const effectiveDp = Number(dpPersen) > 0 ? Number(dpPersen) : 30;

  // Stagger animation helper
  const fadeUpVariant = {
    hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : custom * 0.08,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  return (
    <section
      aria-label="Hero PirantiKu - Booking Alat Serba Ada"
      className="relative w-full min-h-[calc(100dvh-80px)] lg:h-[calc(100dvh-80px)] flex items-center justify-center bg-[#f6f5f1] text-[#0f2e39] py-12 lg:py-0 overflow-hidden"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* ========================================================
              KOLOM KIRI (±590px / col-span-7)
              ======================================================== */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center space-y-6 sm:space-y-7">
            {/* 1. Badge Pil Krem */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fbeccd] border border-[#f2c96b]/40 text-[#8a5a12] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] select-none shadow-xs">
                <span>PIRANTIKU · BOOKING ALAT SERBA ADA</span>
              </div>
            </motion.div>

            {/* 2. Judul H1 dengan Highlight [Stok Pasti] */}
            <motion.h1
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="text-4xl sm:text-6xl lg:text-[62px] xl:text-[70px] 2xl:text-[76px] font-extrabold text-[#0f2e39] leading-[1.06] tracking-tight"
            >
              Booking Alat Tanpa Ribet,{" "}
              <span className="inline-block bg-[#f2c96b] text-[#0f2e39] px-3 py-1 sm:px-4 sm:py-1.5 rounded-2xl shadow-xs">
                Stok Pasti
              </span>
              , Tinggal Ambil.
            </motion.h1>

            {/* 3. Paragraf 2 Kalimat */}
            <motion.p
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="text-base sm:text-lg xl:text-xl text-[#3f5a64] leading-relaxed max-w-xl xl:max-w-2xl"
            >
              Camping, pertukangan, olahraga, hingga acara. Pilih tanggal, amankan stok dengan DP, lalu ambil alat tepat waktu.
            </motion.p>

            {/* 4. Dua Tombol dengan Hard Shadow (Neobrutalist) */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-4 pt-1 w-full min-[480px]:w-auto"
            >
              {/* Tombol Lihat Katalog */}
              <Link
                href="/alat"
                className="w-full min-[480px]:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-9 py-4 rounded-2xl bg-[#1f4e5f] text-white font-bold text-base sm:text-lg shadow-[5px_5px_0_#0f2e39] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#0f2e39] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-150 cursor-pointer select-none"
              >
                <span>Lihat Katalog</span>
                <span aria-hidden="true">→</span>
              </Link>

              {/* Tombol Hubungi Admin */}
              <a
                href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-[480px]:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-9 py-4 rounded-2xl bg-white border-2 border-[#1f4e5f] text-[#1f4e5f] font-bold text-base sm:text-lg shadow-[5px_5px_0_#8a5a12] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#8a5a12] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-150 cursor-pointer select-none"
              >
                <span>Hubungi Admin</span>
              </a>
            </motion.div>

            {/* 5. Garis Pemisah Tipis */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="h-[1px] bg-[#e3e1d9] w-full max-w-xl my-1"
              aria-hidden="true"
            />

            {/* 6. Tiga Poin Centang Bulat Teal */}
            <motion.div
              custom={6}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm sm:text-base font-bold text-[#0f2e39]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f4e5f] text-white">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
                <span>Stok terkunci per tanggal</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f4e5f] text-white">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
                <span>DP mulai {effectiveDp}%</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f4e5f] text-white">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
                <span>Tanpa antre, tinggal ambil</span>
              </div>
            </motion.div>
          </div>

          {/* ========================================================
              KOLOM KANAN: KARTU NOTA BOOKING (col-span-5)
              ======================================================== */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end mt-6 lg:mt-0">
            <BookingReceiptCard totalActiveTypes={totalActiveTypes} />
          </div>
        </div>
      </div>
    </section>
  );
}
