"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Package, ArrowUpRight, Sparkles, CheckCircle2 } from "lucide-react";
import type { EquipmentWithDetails } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { getCategoryIcon, getCategoryAccent } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface EquipmentCardProps {
  equipment: EquipmentWithDetails;
  priority?: boolean;
}

export function EquipmentCard({ equipment, priority = false }: EquipmentCardProps) {
  const availableStock = Math.max(
    0,
    (equipment.stok || 0) - (equipment.stok_rusak || 0)
  );
  const isAvailable = availableStock > 0;

  // Foto utama atau placeholder
  const primaryImage =
    equipment.images?.find((img) => img.is_utama)?.url ||
    equipment.images?.[0]?.url ||
    null;

  const CategoryIcon = getCategoryIcon(equipment.category?.ikon);
  const accent = getCategoryAccent(equipment.category?.ikon);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300"
    >
      <Link href={`/alat/${equipment.slug}`} className="flex flex-col flex-1">
        {/* Gambar Rasio 4:3 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/60">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={equipment.nama}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            // Placeholder Elegan (Gradasi Lembut + Ikon Kategori)
            <div
              className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${accent.gradient} p-6 text-center transition-transform duration-500 group-hover:scale-105`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm shadow-sm border border-border/50 text-primary">
                <CategoryIcon className="h-8 w-8" />
              </div>
              <span className="mt-3 text-xs font-semibold text-muted-foreground/80 tracking-wide">
                {equipment.category?.nama || "Peralatan"}
              </span>
            </div>
          )}

          {/* Badge Stok di sudut atas gambar */}
          <div className="absolute left-3 top-3 z-10">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-md border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tersedia {availableStock} unit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-md border border-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Stok Habis
              </span>
            )}
          </div>

          {/* Kategori Badge di sudut kanan atas */}
          {equipment.category && (
            <div className="absolute right-3 top-3 z-10">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md shadow-sm bg-card/90 ${accent.text} ${accent.border}`}
              >
                <CategoryIcon className="h-3 w-3" />
                {equipment.category.nama}
              </span>
            </div>
          )}
        </div>

        {/* Konten Kartu */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {equipment.nama}
          </h3>

          {equipment.deskripsi && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {equipment.deskripsi}
            </p>
          )}

          {/* Harga dan CTA */}
          <div className="mt-auto pt-4 flex items-end justify-between border-t border-border/60">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Harga Sewa</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-foreground">
                  {formatRupiah(equipment.harga_per_hari)}
                </span>
                <span className="text-xs text-muted-foreground">/hari</span>
              </div>
              {equipment.harga_mingguan && (
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Mingguan: {formatRupiah(equipment.harga_mingguan)}
                </p>
              )}
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
