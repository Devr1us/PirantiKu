"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { Category } from "@/types/database";
import { getCategoryIcon, getCategoryDescription } from "@/lib/constants";

interface CategorySectionProps {
  categories: Category[];
  categoryCounts: Record<number, number>;
  totalActiveTypes?: number;
}

export function CategorySection({
  categories,
  categoryCounts,
  totalActiveTypes = 0,
}: CategorySectionProps) {
  return (
    <section
      id="kategori"
      aria-label="Kategori Alat PirantiKu"
      className="w-full py-16 md:py-24 bg-white text-[#0f2e39]"
    >
      <div className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 space-y-10 sm:space-y-12">
        {/* ========================================================
            HEADER SECTION KATEGORI
            ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e3e1d9] pb-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-[40px] font-extrabold tracking-tight text-[#1f4e5f] leading-tight">
              Kategori Alat
            </h2>
            <p className="text-sm sm:text-base text-[#5F7A84] font-medium max-w-xl">
              Perlengkapan lengkap sesuai kebutuhan aktivitas Anda.
            </p>
          </div>

          <Link
            href="/alat"
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#8a5a12] hover:text-[#1f4e5f] transition-colors shrink-0 group"
          >
            <span>Lihat semua</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ========================================================
            GRID 3 KOLOM KARTU KATEGORI
            ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const IconComponent = getCategoryIcon(cat.ikon);
            const count = categoryCounts[cat.id] || 0;
            const desc = getCategoryDescription(cat.slug);

            return (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group flex flex-col justify-between h-full bg-[#f6f5f1] border border-[#e3e1d9]/70 rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#1f4e5f]/30"
              >
                <div className="space-y-5">
                  {/* Area Ikon di Atas */}
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#e3e1d9] flex items-center justify-center text-[#1f4e5f] shadow-xs group-hover:bg-[#1f4e5f] group-hover:text-white transition-colors duration-200">
                    <IconComponent className="h-7 w-7 stroke-[1.8]" />
                  </div>

                  {/* Nama & Deskripsi */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[#1f4e5f] group-hover:text-[#8a5a12] transition-colors">
                      {cat.nama}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5F7A84] leading-relaxed line-clamp-3">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Footer Kartu: N Alat Aktif -> */}
                <div className="mt-6 pt-4 border-t border-[#e3e1d9] flex items-center justify-between text-xs sm:text-sm font-bold text-[#1f4e5f]">
                  <span className="text-[#5F7A84] font-semibold">
                    {count} alat aktif
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#8a5a12] group-hover:translate-x-1 transition-transform">
                    <span>Lihat alat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Kartu Tambahan: Semua Alat */}
          <Link
            href="/alat"
            className="group flex flex-col justify-between h-full bg-[#f6f5f1] border border-[#e3e1d9]/70 rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#1f4e5f]/30"
          >
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#e3e1d9] flex items-center justify-center text-[#1f4e5f] shadow-xs group-hover:bg-[#1f4e5f] group-hover:text-white transition-colors duration-200">
                <Layers className="h-7 w-7 stroke-[1.8]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#1f4e5f] group-hover:text-[#8a5a12] transition-colors">
                  Semua Alat
                </h3>
                <p className="text-xs sm:text-sm text-[#5F7A84] leading-relaxed">
                  Jelajahi seluruh inventaris perlengkapan dan perkakas yang tersedia di PirantiKu.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e3e1d9] flex items-center justify-between text-xs sm:text-sm font-bold text-[#1f4e5f]">
              <span className="text-[#5F7A84] font-semibold">
                {totalActiveTypes > 0 ? `${totalActiveTypes} macam alat` : "Katalog Lengkap"}
              </span>
              <span className="inline-flex items-center gap-1 text-[#8a5a12] group-hover:translate-x-1 transition-transform">
                <span>Buka katalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
