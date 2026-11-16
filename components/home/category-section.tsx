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
      className="w-full py-16 md:py-24 bg-white text-[var(--text-main)]"
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 space-y-10 sm:space-y-12">
        {/* ========================================================
            HEADER SECTION KATEGORI
            ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-[40px] font-extrabold tracking-tight text-[var(--bg-dark)] leading-tight">
              Kategori Alat
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)] font-medium max-w-xl">
              Perlengkapan lengkap sesuai kebutuhan aktivitas Anda.
            </p>
          </div>

          <Link
            href="/alat"
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[var(--bg-dark)] hover:text-[var(--accent-gold)] transition-colors shrink-0 group"
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
                className="group flex flex-col justify-between h-full bg-white border border-[var(--border-soft)] rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--bg-dark)]"
              >
                <div className="space-y-5">
                  {/* Area Ikon di Atas */}
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-sage)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--bg-dark)] shadow-xs group-hover:bg-[var(--bg-dark)] group-hover:text-white transition-colors duration-200">
                    <IconComponent className="h-7 w-7 stroke-[1.8]" />
                  </div>

                  {/* Nama & Deskripsi */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[var(--bg-dark)] group-hover:text-[var(--accent-gold)] transition-colors">
                      {cat.nama}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Footer Kartu: N Alat Aktif -> */}
                <div className="mt-6 pt-4 border-t border-[var(--border-soft)] flex items-center justify-between text-sm font-bold text-[var(--bg-dark)]">
                  <span className="text-[var(--text-muted)] font-medium">
                    {count} alat aktif
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--accent-gold)] group-hover:translate-x-1 transition-transform">
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
            className="group flex flex-col justify-between h-full bg-white border border-[var(--border-soft)] rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--bg-dark)]"
          >
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-sage)] border border-[var(--border-soft)] flex items-center justify-center text-[var(--bg-dark)] shadow-xs group-hover:bg-[var(--bg-dark)] group-hover:text-white transition-colors duration-200">
                <Layers className="h-7 w-7 stroke-[1.8]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--bg-dark)] group-hover:text-[var(--accent-gold)] transition-colors">
                  Semua Alat
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Jelajahi seluruh inventaris perlengkapan dan perkakas yang tersedia di PirantiKu.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-soft)] flex items-center justify-between text-sm font-bold text-[var(--bg-dark)]">
              <span className="text-[var(--text-muted)] font-medium">
                {totalActiveTypes > 0 ? `${totalActiveTypes} macam alat` : "Katalog Lengkap"}
              </span>
              <span className="inline-flex items-center gap-1 text-[var(--accent-gold)] group-hover:translate-x-1 transition-transform">
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
