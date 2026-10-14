"use client";

import * as React from "react";
import { ExternalLink, MapPin, Navigation, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOKASI_DEFAULT } from "@/lib/constants";

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Validasi latitude dan longitude sebagai angka yang valid dalam rentang bumi.
 * Latitude: -90 s/d 90
 * Longitude: -180 s/d 180
 */
export function validateCoordinates(
  lat: unknown,
  lng: unknown
): Coordinates | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }
  const latNum = typeof lat === "number" ? lat : parseFloat(String(lat).trim());
  const lngNum = typeof lng === "number" ? lng : parseFloat(String(lng).trim());

  if (
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum) &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  ) {
    return { lat: latNum, lng: lngNum };
  }
  return null;
}

/**
 * Menentukan sumber URL embed Google Maps berdasarkan prioritas:
 * 1. maps_embed_url dari settings bila terisi DAN diawali https://www.google.com/maps
 * 2. URL embed standar dari koordinat lat & lng
 * 3. null jika koordinat tidak valid
 */
export function resolveMapEmbedUrl(
  embedUrl?: string | null,
  lat?: number | string | null,
  lng?: number | string | null
): { url: string; coords: Coordinates | null } | null {
  const trimmed = typeof embedUrl === "string" ? embedUrl.trim() : "";
  const coords = validateCoordinates(lat, lng);

  // Prioritas 1: Jika maps_embed_url valid dan diawali https://www.google.com/maps
  if (trimmed && trimmed.startsWith("https://www.google.com/maps")) {
    return {
      url: trimmed,
      coords,
    };
  }

  // Prioritas 2: Dari koordinat yang tervalidasi
  if (coords) {
    return {
      url: `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=17&hl=id&output=embed`,
      coords,
    };
  }

  return null;
}

export interface LocationMapProps {
  lat?: number | string | null;
  lng?: number | string | null;
  embedUrl?: string | null;
  alamat?: string;
  className?: string;
}

/**
 * Panel Peta Google Maps Tersemat (Iframe)
 */
export function LocationMap({
  lat = LOKASI_DEFAULT.lat,
  lng = LOKASI_DEFAULT.lng,
  embedUrl,
  alamat = LOKASI_DEFAULT.alamat,
  className = "",
}: LocationMapProps) {
  const [isIframeLoaded, setIsIframeLoaded] = React.useState(false);

  const resolved = React.useMemo(
    () => resolveMapEmbedUrl(embedUrl, lat, lng),
    [embedUrl, lat, lng]
  );

  const coords = resolved?.coords || validateCoordinates(lat, lng);

  // Jika lat/lng tidak valid dan embed url tidak valid, tampilkan kembali placeholder
  if (!resolved || !coords) {
    const fallbackSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      alamat || LOKASI_DEFAULT.alamat
    )}`;

    return (
      <div
        className={cn(
          "w-full h-[320px] lg:h-full lg:min-h-[380px] rounded-xl border border-[#E8E8E1] bg-[#F3F3EF] flex flex-col items-center justify-center p-6 text-center shadow-xs",
          className
        )}
      >
        <MapPin className="h-10 w-10 text-[#5F7A84] mb-2" />
        <p className="text-sm font-bold text-[#234E5C]">Peta Lokasi</p>
        <p className="text-xs text-[#5F7A84] mt-1 max-w-sm">
          Toko kami berlokasi di {alamat || LOKASI_DEFAULT.alamat}. Silakan buka peta Google Maps untuk melihat lokasi.
        </p>
        <a
          href={fallbackSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block"
        >
          <Button variant="outline" size="sm" className="text-xs">
            Buka di Google Maps
          </Button>
        </a>
      </div>
    );
  }

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  return (
    <div className={cn("w-full flex flex-col", className)}>
      <div className="relative w-full h-[320px] lg:h-full lg:min-h-[380px] rounded-xl overflow-hidden border border-[#E8E8E1] bg-[#F3F3EF] shadow-sm">
        {/* Placeholder skeleton saat iframe sedang dimuat */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300 pointer-events-none",
            isIframeLoaded ? "opacity-0" : "opacity-100"
          )}
          aria-hidden="true"
        >
          <MapPin className="h-8 w-8 text-[#5F7A84] animate-pulse mb-1.5" />
          <p className="text-xs font-semibold text-[#5F7A84]">
            Memuat peta PirantiKu...
          </p>
        </div>

        {/* Google Maps Iframe */}
        <iframe
          src={resolved.url}
          title="Peta lokasi PirantiKu"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setIsIframeLoaded(true)}
          className={cn(
            "w-full h-full border-0 absolute inset-0 transition-opacity duration-500",
            isIframeLoaded ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Tombol kecil "Buka di Google Maps" melayang di sudut kiri bawah peta */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10">
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#234E5C] text-xs font-bold shadow-md border border-[#E8E8E1] backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#A0630F]" />
            <span>Buka di Google Maps</span>
          </a>
        </div>

        {/* Fallback tanpa JavaScript di dalam <noscript> */}
        <noscript>
          <div className="absolute inset-0 bg-[#F3F3EF] flex flex-col items-center justify-center p-6 text-center z-20">
            <p className="text-sm font-bold text-[#234E5C] mb-2">Peta Google Maps</p>
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#A0630F] underline hover:text-[#85510A]"
            >
              Lihat di Google Maps
            </a>
          </div>
        </noscript>
      </div>

      {/* Fallback teks tautan di bawah peta bila iframe diblokir browser */}
      <div className="mt-2 text-right">
        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#5F7A84] hover:text-[#234E5C] underline transition-colors"
        >
          Lihat di Google Maps
        </a>
      </div>
    </div>
  );
}

/**
 * Tombol Salin Alamat dengan notifikasi Toast Sonner dan cadangan seleksi teks
 */
export function CopyAddressButton({
  alamat,
  targetElementId = "alamat-pengambilan-text",
  className = "",
}: {
  alamat: string;
  targetElementId?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(alamat);
        setCopied(true);
        toast.success("Alamat disalin");
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // Lanjutkan ke fallback berikutnya
    }

    // Fallback 1: document.execCommand('copy')
    let success = false;
    try {
      const textarea = document.createElement("textarea");
      textarea.value = alamat;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      success = document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      success = false;
    }

    if (success) {
      setCopied(true);
      toast.success("Alamat disalin");
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback 2: Pilih teks alamat pada DOM
      if (typeof window !== "undefined") {
        const el = document.getElementById(targetElementId);
        if (el) {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
      toast.info("Alamat dipilih, silakan salin");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "rounded-full border border-[#234E5C] text-[#234E5C] bg-white font-bold hover:bg-[#234E5C] hover:text-white text-xs gap-1.5 h-9 px-4",
        className
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-current" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-current" />
      )}
      <span>{copied ? "Alamat Disalin" : "Salin Alamat"}</span>
    </Button>
  );
}

/**
 * Tombol Petunjuk Arah (Ochre Pill) membuka Google Maps Directions
 */
export function DirectionsButton({
  lat = LOKASI_DEFAULT.lat,
  lng = LOKASI_DEFAULT.lng,
  className = "",
}: {
  lat?: number | string | null;
  lng?: number | string | null;
  className?: string;
}) {
  const coords = validateCoordinates(lat, lng) || {
    lat: LOKASI_DEFAULT.lat,
    lng: LOKASI_DEFAULT.lng,
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      <Button
        type="button"
        variant="warm"
        size="sm"
        className={cn(
          "rounded-full bg-[#A0630F] text-white font-bold hover:bg-[#85510A] text-xs gap-1.5 h-9 px-4",
          className
        )}
      >
        <Navigation className="h-3.5 w-3.5" />
        <span>Petunjuk Arah</span>
      </Button>
    </a>
  );
}

export default LocationMap;
