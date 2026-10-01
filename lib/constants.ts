import {
  Mountain,
  Hammer,
  Dumbbell,
  Home,
  PartyPopper,
  Package,
  Wrench,
  Camera,
  Music,
  Tent,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { BookingStatus, PaymentStatus } from "@/types/database";

export const APP_NAME = "PirantiKu";
export const TAGLINE = "SEWA ALAT SERBA ADA";
export const APP_DESCRIPTION =
  "Platform sewa alat serba ada dengan kepastian stok per tanggal, DP ringan, dan kondisi prima.";

// Kategori icon fallback mapping
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  mountain: Mountain,
  hammer: Hammer,
  dumbbell: Dumbbell,
  home: Home,
  "party-popper": PartyPopper,
  package: Package,
  wrench: Wrench,
  camera: Camera,
  music: Music,
  tent: Tent,
  sparkles: Sparkles,
};

export const FALLBACK_CATEGORY_ICON: LucideIcon = Package;

export function getCategoryIcon(ikonName?: string | null): LucideIcon {
  if (!ikonName) return FALLBACK_CATEGORY_ICON;
  const normalized = ikonName.toLowerCase().trim();
  return CATEGORY_ICON_MAP[normalized] || FALLBACK_CATEGORY_ICON;
}

// Pemetaan deskripsi singkat per slug kategori (tanpa mengubah kolom database)
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  outdoor: "Tenda, matras, kompor portabel, dan perlengkapan kegiatan alam terbuka.",
  pertukangan: "Bor listrik, gergaji mesin, gerinda, tangga, dan perkakas proyek.",
  olahraga: "Sepeda, raket, bola, matras, dan perlengkapan olahraga terawat.",
  "rumah-tangga": "Pressure washer, vacuum cleaner, pemotong rumput, dan alat kebersihan.",
  event: "Sound system, proyektor, speaker portable, mic, dan kebutuhan acara.",
};

export const FALLBACK_CATEGORY_DESCRIPTION =
  "Pilihan perlengkapan berkualitas siap sewa dengan stok terjamin per tanggal.";

export function getCategoryDescription(slug?: string | null): string {
  if (!slug) return FALLBACK_CATEGORY_DESCRIPTION;
  const normalized = slug.toLowerCase().trim();
  return CATEGORY_DESCRIPTIONS[normalized] || FALLBACK_CATEGORY_DESCRIPTION;
}

// Konfigurasi Status Badge Booking (Pastel + Teks Gelap, bukan warna jenuh)
export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    description: string;
  }
> = {
  menunggu_dp: {
    label: "Menunggu DP",
    bg: "bg-[#FEF3C7]",
    text: "text-[#78350F]",
    border: "border-[#FDE68A]",
    dot: "bg-[#D97706]",
    description: "Silakan bayar DP untuk mengamankan pesanan alat.",
  },
  dp_dibayar: {
    label: "DP Terverifikasi",
    bg: "bg-[#E0F2FE]",
    text: "text-[#0369A1]",
    border: "border-[#BAE6FD]",
    dot: "bg-[#0284C7]",
    description: "DP telah diverifikasi admin. Pesanan telah dijadwalkan.",
  },
  lunas: {
    label: "Lunas",
    bg: "bg-[#E2F0D9]",
    text: "text-[#2E5E4E]",
    border: "border-[#C5E1A5]",
    dot: "bg-[#2E5E4E]",
    description: "Pembayaran telah lunas. Alat siap diambil sesuai jadwal.",
  },
  diambil: {
    label: "Sedang Digunakan",
    bg: "bg-[#EDE9FE]",
    text: "text-[#5B21B6]",
    border: "border-[#DDD6FE]",
    dot: "bg-[#7C3AED]",
    description: "Alat sudah diserahkan kepada penyewa.",
  },
  terlambat: {
    label: "Terlambat",
    bg: "bg-[#FEE2E2]",
    text: "text-[#991B1B]",
    border: "border-[#FECACA]",
    dot: "bg-[#DC2626]",
    description: "Masa sewa berakhir namun alat belum dikembalikan.",
  },
  dikembalikan: {
    label: "Dikembalikan",
    bg: "bg-[#E6FFFA]",
    text: "text-[#234E5C]",
    border: "border-[#B2F5EA]",
    dot: "bg-[#234E5C]",
    description: "Alat sudah dikembalikan dan sedang dicek kelengkapannya.",
  },
  bermasalah: {
    label: "Bermasalah",
    bg: "bg-[#FFEDD5]",
    text: "text-[#9A3412]",
    border: "border-[#FED7AA]",
    dot: "bg-[#EA580C]",
    description: "Terdapat kerusakan atau denda yang perlu diselesaikan.",
  },
  selesai: {
    label: "Selesai",
    bg: "bg-[#F3F4F6]",
    text: "text-[#374151]",
    border: "border-[#E5E7EB]",
    dot: "bg-[#4B5563]",
    description: "Booking telah selesai dan deposit telah diselesaikan.",
  },
  dibatalkan: {
    label: "Dibatalkan",
    bg: "bg-[#F1F5F9]",
    text: "text-[#475569]",
    border: "border-[#CBD5E1]",
    dot: "bg-[#64748B]",
    description: "Booking dibatalkan.",
  },
};

// Konfigurasi Status Pembayaran (Pastel + Teks Gelap)
export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  menunggu_verifikasi: {
    label: "Menunggu Verifikasi",
    bg: "bg-[#FEF3C7] text-[#78350F]",
    text: "text-[#78350F]",
  },
  terverifikasi: {
    label: "Terverifikasi",
    bg: "bg-[#E2F0D9] text-[#2E5E4E]",
    text: "text-[#2E5E4E]",
  },
  ditolak: {
    label: "Ditolak",
    bg: "bg-[#FEE2E2] text-[#991B1B]",
    text: "text-[#991B1B]",
  },
};

// Default Fallback Settings
export const DEFAULT_SETTINGS = {
  dp_persen: 30,
  denda_per_hari: 50000,
  rekening_bank: "BCA 1234567890 a/n PirantiKu",
  qris_url: "",
  whatsapp_admin: "6281234567890",
  jam_operasional: "Senin - Minggu: 08.00 - 21.00 WIB",
  alamat: "Jl. Raya Rental No. 12, Jakarta",
  maps_embed_url: "",
};
