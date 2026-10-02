"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { EquipmentWithDetails } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { getCategoryIcon } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface EquipmentCardProps {
  equipment: EquipmentWithDetails;
  priority?: boolean;
}

export function EquipmentCard({ equipment, priority = false }: EquipmentCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const availableStock = Math.max(
    0,
    (equipment.stok || 0) - (equipment.stok_rusak || 0)
  );
  const isAvailable = availableStock > 0;

  const primaryImage =
    equipment.images?.find((img) => img.is_utama)?.url ||
    equipment.images?.[0]?.url ||
    null;

  const IconComp = getCategoryIcon(equipment.category?.ikon);

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#E8E8E1] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow h-full"
    >
      <div className="flex flex-col flex-1 space-y-3">
        {/* Foto Frame: rounded-2xl, Aspect 4:3 atau Square, zoom 1.04 on hover */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F5F3EB] border border-[#E8E8E1]/70">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={equipment.nama}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            // Placeholder datar krem + ikon petrol (tanpa gradasi)
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-[#234E5C]">
              <IconComp className="h-10 w-10 stroke-[1.8]" />
              <span className="mt-2 text-[11px] font-semibold text-[#5F7A84]">
                {equipment.category?.nama || "Peralatan"}
              </span>
            </div>
          )}

          {/* Badge Stok di Sudut Kiri Atas */}
          <div className="absolute left-2.5 top-2.5 z-10">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E2F0D9] border border-[#C5E1A5] px-2.5 py-0.5 text-[11px] font-bold text-[#2E5E4E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E5E4E]" />
                Tersedia {availableStock} unit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] border border-[#FECACA] px-2.5 py-0.5 text-[11px] font-bold text-[#991B1B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                Stok Habis
              </span>
            )}
          </div>
        </div>

        {/* Informasi Alat */}
        <div className="space-y-1.5 px-0.5">
          {equipment.category && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5F7A84] block truncate">
              {equipment.category.nama}
            </span>
          )}

          <Link href={`/alat/${equipment.slug}`}>
            <h3 className="text-base font-bold text-[#234E5C] line-clamp-2 hover:text-[#A0630F] transition-colors leading-snug">
              {equipment.nama}
            </h3>
          </Link>

          {equipment.deskripsi && (
            <p className="text-xs text-[#5F7A84] line-clamp-2 leading-relaxed">
              {equipment.deskripsi}
            </p>
          )}
        </div>
      </div>

      {/* Harga Sewa dan Tombol Ochre Kecil */}
      <div className="mt-4 pt-3 border-t border-[#E8E8E1] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#5F7A84] block">
            Harga Sewa
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-[#A0630F]">
              {formatRupiah(equipment.harga_per_hari)}
            </span>
            <span className="text-[11px] text-[#5F7A84]">/hari</span>
          </div>
        </div>

        <Link href={`/alat/${equipment.slug}`}>
          <Button
            variant="warm"
            size="sm"
            className="h-8 px-3.5 text-xs font-bold"
          >
            Lihat Detail
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
