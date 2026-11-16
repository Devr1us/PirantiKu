"use client";

import * as React from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentImage {
  id: number | string;
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
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [prevPrimary, setPrevPrimary] = React.useState<string | null>(primaryImage);

  if (prevPrimary !== primaryImage) {
    setPrevPrimary(primaryImage);
    setSelectedImage(null);
  }

  // Filter gambar unik, cegah duplikasi thumbnail dan abaikan placeholder unsplash jika sudah ada foto lokal
  const uniqueImages = React.useMemo(() => {
    const list: EquipmentImage[] = [];
    const seen = new Set<string>();

    if (primaryImage) {
      seen.add(primaryImage);
      list.push({ id: "primary", url: primaryImage, is_utama: true });
    }

    const hasLocalPrimary = primaryImage?.startsWith("/images/");

    for (const img of images || []) {
      if (!img?.url) continue;
      // Lewati Unsplash jika unit sudah memiliki foto lokal terverifikasi
      if (hasLocalPrimary && img.url.includes("images.unsplash.com")) {
        continue;
      }
      if (!seen.has(img.url)) {
        seen.add(img.url);
        list.push(img);
      }
    }

    return list;
  }, [images, primaryImage]);

  const displayImage = selectedImage || primaryImage;

  return (
    <div className="space-y-3">
      {/* Gambar Utama */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E8E8E1] bg-[#F5F3EB] shadow-sm">
        <SafeImage
          src={displayImage || ""}
          alt={nama}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
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
                Foto produk siap dibooking dengan kondisi prima
              </span>
            </div>
          }
        />
      </div>

      {/* Thumbnail HANYA jika ada lebih dari 1 foto unik berbeda */}
      {uniqueImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {uniqueImages.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImage(img.url)}
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
                sizes="96px"
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
