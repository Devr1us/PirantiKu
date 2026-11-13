"use client";

import * as React from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentImage {
  id: number;
  url: string;
  is_utama?: boolean;
}

interface EquipmentGalleryProps {
  images: EquipmentImage[];
  primaryImage: string | null;
  nama: string;
  categoryIconEl?: React.ReactNode;
}

export function EquipmentGallery({
  images,
  primaryImage,
  nama,
  categoryIconEl,
}: EquipmentGalleryProps) {
  const [activeImage, setActiveImage] = React.useState<string | null>(primaryImage);

  const displayImage = activeImage || primaryImage;

  return (
    <div className="space-y-3">
      {/* Gambar Utama */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E8E8E1] bg-[#F5F3EB] shadow-sm">
        <SafeImage
          src={displayImage || ""}
          alt={nama}
          fill
          priority
          className="object-cover transition-opacity duration-200"
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-[#234E5C]">
              {categoryIconEl ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-[#E8E8E1] text-[#234E5C] mb-3">
                  {categoryIconEl}
                </div>
              ) : (
                <Package className="h-12 w-12 stroke-[1.5] mb-3" />
              )}
              <span className="text-sm font-bold text-[#234E5C]">{nama}</span>
              <span className="text-xs text-[#5F7A84] mt-1">
                Foto produk siap disewa dengan kondisi prima
              </span>
            </div>
          }
        />
      </div>

      {/* Thumbnail jika ada lebih dari 1 foto */}
      {images && images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveImage(img.url)}
              aria-label={`Lihat foto ${nama}`}
              className={cn(
                "relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border bg-[#F5F3EB] cursor-pointer transition-all",
                displayImage === img.url
                  ? "border-[#234E5C] ring-2 ring-[#234E5C]/20"
                  : "border-[#E8E8E1] hover:border-[#234E5C]"
              )}
            >
              <SafeImage
                src={img.url}
                alt={nama}
                fill
                className="object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-[#F3F3EF] text-[#5F7A84] text-[10px]">
                    Foto
                  </div>
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
