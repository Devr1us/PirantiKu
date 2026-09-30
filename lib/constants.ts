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

export const APP_NAME = "SewaDongKak";
export const TAGLINE = "Sewa Alat Praktis, Mudah & Terpercaya untuk Segala Kebutuhan";
export const APP_DESCRIPTION =
  "Platform penyewaan alat terpercaya untuk outdoor, pertukangan, olahraga, rumah tangga, dan event. Proses cepat, stok transparan, dan garansi alat prima.";

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

// Category accent colors for visual richness & cards
export const CATEGORY_ACCENT_MAP: Record<
  string,
  { bg: string; text: string; border: string; gradient: string }
> = {
  mountain: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
  hammer: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  dumbbell: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800",
    gradient: "from-sky-500/20 to-blue-500/10",
  },
  home: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    gradient: "from-indigo-500/20 to-violet-500/10",
  },
  "party-popper": {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    gradient: "from-rose-500/20 to-pink-500/10",
  },
};

export const FALLBACK_CATEGORY_ACCENT = {
  bg: "bg-slate-50 dark:bg-slate-900/40",
  text: "text-slate-700 dark:text-slate-300",
  border: "border-slate-200 dark:border-slate-800",
  gradient: "from-teal-500/20 to-emerald-500/10",
};

export function getCategoryAccent(ikonName?: string | null) {
  if (!ikonName) return FALLBACK_CATEGORY_ACCENT;
  const normalized = ikonName.toLowerCase().trim();
  return CATEGORY_ACCENT_MAP[normalized] || FALLBACK_CATEGORY_ACCENT;
}

// Konfigurasi Status Badge Booking
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
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/80",
    dot: "bg-amber-500",
    description: "Silakan bayar DP untuk mengamankan pesanan alat.",
  },
  dp_dibayar: {
    label: "DP Terverifikasi",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800/80",
    dot: "bg-sky-500",
    description: "DP telah diverifikasi admin. Pesanan telah dijadwalkan.",
  },
  lunas: {
    label: "Lunas",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/80",
    dot: "bg-emerald-500",
    description: "Pembayaran telah lunas. Alat siap diambil sesuai jadwal.",
  },
  diambil: {
    label: "Sedang Digunakan",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800/80",
    dot: "bg-indigo-500",
    description: "Alat sudah diserahkan kepada penyewa.",
  },
  terlambat: {
    label: "Terlambat",
    bg: "bg-red-50 dark:bg-red-950/50",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/80",
    dot: "bg-red-500",
    description: "Masa sewa berakhir namun alat belum dikembalikan.",
  },
  dikembalikan: {
    label: "Dikembalikan",
    bg: "bg-teal-50 dark:bg-teal-950/50",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800/80",
    dot: "bg-teal-500",
    description: "Alat sudah dikembalikan dan sedang dicek kelengkapannya.",
  },
  bermasalah: {
    label: "Bermasalah",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800/80",
    dot: "bg-orange-500",
    description: "Terdapat kerusakan atau denda yang perlu diselesaikan.",
  },
  selesai: {
    label: "Selesai",
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
    dot: "bg-zinc-500",
    description: "Booking telah selesai dan deposit telah diselesaikan.",
  },
  dibatalkan: {
    label: "Dibatalkan",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    description: "Booking dibatalkan.",
  },
};

// Konfigurasi Status Pembayaran
export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  menunggu_verifikasi: {
    label: "Menunggu Verifikasi",
    bg: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-400",
  },
  terverifikasi: {
    label: "Terverifikasi",
    bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  ditolak: {
    label: "Ditolak",
    bg: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300",
    text: "text-rose-700 dark:text-rose-400",
  },
};

// Default Fallback Settings
export const DEFAULT_SETTINGS = {
  dp_persen: 30,
  denda_per_hari: 50000,
  rekening_bank: "BCA 1234567890 a/n SewaDongKak",
  qris_url: "",
  whatsapp_admin: "6281234567890",
  jam_operasional: "Senin - Minggu: 08.00 - 21.00 WIB",
};
