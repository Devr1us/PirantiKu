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
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import type { BookingStatus, PaymentStatus } from "@/types/database";

export const APP_NAME = "PirantiKu";
export const TAGLINE = "BOOKING ALAT SERBA ADA";
export const APP_DESCRIPTION =
  "Platform booking alat serba ada dengan kepastian stok per tanggal, DP ringan, dan kondisi prima.";

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
  "heart-pulse": HeartPulse,
};

export const FALLBACK_CATEGORY_ICON: LucideIcon = Package;

export function getCategoryIcon(ikonName?: string | null): LucideIcon {
  if (!ikonName) return FALLBACK_CATEGORY_ICON;
  const normalized = ikonName.toLowerCase().trim();
  return CATEGORY_ICON_MAP[normalized] || FALLBACK_CATEGORY_ICON;
}

// Pemetaan deskripsi singkat per slug kategori (tanpa mengubah kolom database)
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  // 8 Kategori Lengkap
  "outdoor-pendakian": "Tenda, matras, kompor portabel, trekking pole, dan perlengkapan kegiatan alam terbuka.",
  "konstruksi-perkakas": "Bor beton, mesin las listrik, gergaji mesin, gerobak dorong, dan perkakas proyek.",
  "olahraga-fitness": "Sepeda lipat, set badminton, bola basket, resistance band, dan perlengkapan olahraga.",
  "rumah-tangga": "Kipas standing, mesin cuci mini, steamer uap, dispenser air, dan alat rumah tangga.",
  "pesta-acara": "Genset portable, lampu sorot, backdrop stand, chafing dish, dan perlengkapan acara.",
  "kamera-elektronik": "Kamera mirrorless, tripod, ring light, gimbal smartphone, dan action cam 4K.",
  "otomotif-bengkel": "Dongkrak buaya, kompresor udara, toolbox kunci, kabel jumper, dan jet cleaner cuci kendaraan.",
  "kesehatan-mobilitas": "Kursi roda lipat, walker lansia, kruk ketiak, tensimeter digital, dan kasur anti dekubitus.",

  // Alias kompatibilitas
  outdoor: "Tenda, matras, kompor portabel, dan perlengkapan kegiatan alam terbuka.",
  pertukangan: "Bor listrik, gergaji mesin, gerinda, tangga, dan perkakas proyek.",
  olahraga: "Sepeda, raket, bola, matras, dan perlengkapan olahraga terawat.",
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

// Lokasi Default (Nilai Cadangan Sesuai Sumber Kebenaran)
export const LOKASI_DEFAULT = {
  alamat:
    "Jl. Manggis 5 No. 20, Watuburik, Wonorejo, Kec. Gondangrejo, Kabupaten Karanganyar, Jawa Tengah 57188",
  lat: -7.526135,
  lng: 110.834555,
};

// Default Fallback Settings
export const DEFAULT_SETTINGS = {
  dp_persen: 30,
  denda_per_hari: 50000,
  rekening_bank: "BCA 1234567890 a/n PirantiKu",
  qris_url: "",
  whatsapp_admin: "6281234567890",
  jam_operasional: "Senin - Minggu: 08.00 - 21.00 WIB",
  alamat: LOKASI_DEFAULT.alamat,
  lokasi_lat: LOKASI_DEFAULT.lat,
  lokasi_lng: LOKASI_DEFAULT.lng,
  maps_embed_url: "",
};

// Pemetaan Foto Produk Lokal di public/images/alat/
export const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  // Outdoor & Pendakian
  "tenda-dome-4-orang": "/images/alat/tenda-dome-4-orang.png",
  "tenda-4-orang": "/images/alat/tenda-dome-4-orang.png",
  tendadome4orang: "/images/alat/tenda-dome-4-orang.png",
  tenda4orang: "/images/alat/tenda-dome-4-orang.png",
  "1": "/images/alat/tenda-dome-4-orang.png",
  "carrier-60-liter": "/images/alat/carrier-60-liter.png",
  carrier60liter: "/images/alat/carrier-60-liter.png",
  "2": "/images/alat/carrier-60-liter.png",
  "trekking-pole": "/images/alat/trekking-pole.png",
  trekkingpole: "/images/alat/trekking-pole.png",
  "23": "/images/alat/trekking-pole.png",
  "headlamp-led": "/images/alat/headlamp-led.png",
  headlampled: "/images/alat/headlamp-led.png",
  "24": "/images/alat/headlamp-led.png",
  "hammock-camping": "/images/alat/hammock-camping.png",
  hammockcamping: "/images/alat/hammock-camping.png",
  "25": "/images/alat/hammock-camping.png",
  "kursi-camping-lipat": "/images/alat/kursi-camping-lipat.png",
  kursicampinglipat: "/images/alat/kursi-camping-lipat.png",
  "26": "/images/alat/kursi-camping-lipat.png",

  // Konstruksi & Perkakas
  cangkul: "/images/alat/cangkul.png",
  "7": "/images/alat/cangkul.png",
  sekop: "/images/alat/sekop.png",
  "8": "/images/alat/sekop.png",
  "tangga-lipat": "/images/alat/tangga-lipat-4-meter.png",
  "tangga-lipat-4-meter": "/images/alat/tangga-lipat-4-meter.png",
  tanggalipat: "/images/alat/tangga-lipat-4-meter.png",
  tanggalipat4meter: "/images/alat/tangga-lipat-4-meter.png",
  "9": "/images/alat/tangga-lipat-4-meter.png",
  "mesin-las-inverter": "/images/alat/mesin-las-inverter.png",
  mesinlasinverter: "/images/alat/mesin-las-inverter.png",
  "27": "/images/alat/mesin-las-inverter.png",
  "bor-beton": "/images/alat/bor-beton.png",
  "bor-beton-rotary-hammer": "/images/alat/bor-beton.png",
  borbeton: "/images/alat/bor-beton.png",
  "28": "/images/alat/bor-beton.png",
  "gergaji-circular": "/images/alat/gergaji-circular.png",
  gergajicircular: "/images/alat/gergaji-circular.png",
  gergajicilcular: "/images/alat/gergaji-circular.png",
  "29": "/images/alat/gergaji-circular.png",

  // Olahraga & Fitness
  "net-voli-tiang": "/images/alat/net-voli-dan-tiang.png",
  "net-voli-dan-tiang": "/images/alat/net-voli-dan-tiang.png",
  netvolidantiang: "/images/alat/net-voli-dan-tiang.png",
  "13": "/images/alat/net-voli-dan-tiang.png",
  "sepeda-lipat": "/images/alat/sepeda-lipat.png",
  sepedalipat: "/images/alat/sepeda-lipat.png",
  "31": "/images/alat/sepeda-lipat.png",
  "set-badminton-portable": "/images/alat/set-badminton-portable.png",
  setbadmintonportable: "/images/alat/set-badminton-portable.png",
  "32": "/images/alat/set-badminton-portable.png",
  "resistance-band-set": "/images/alat/resistance-band-set.png",
  resistancebandset: "/images/alat/resistance-band-set.png",
  "33": "/images/alat/resistance-band-set.png",

  // Rumah Tangga & Kebersihan
  "steam-cleaner": "/images/alat/steam-cleaner.png",
  steamcleaner: "/images/alat/steam-cleaner.png",
  "15": "/images/alat/steam-cleaner.png",
  "mesin-potong-rambut": "/images/alat/mesin-potong-rambut.png",
  "mesin-potong-rumput": "/images/alat/mesin-potong-rambut.png",
  mesinpotongrambut: "/images/alat/mesin-potong-rambut.png",
  mesinpotongrumput: "/images/alat/mesin-potong-rambut.png",
  "16": "/images/alat/mesin-potong-rambut.png",
  "pompa-air": "/images/alat/pompa-air.png",
  pompaair: "/images/alat/pompa-air.png",
  "17": "/images/alat/pompa-air.png",
  "kipas-angin-standing": "/images/alat/kipas-angin-standing.png",
  kipasanginstanding: "/images/alat/kipas-angin-standing.png",
  "35": "/images/alat/kipas-angin-standing.png",
  "mesin-cuci-portable": "/images/alat/mesin-cuci-portable.png",
  mesincuciportable: "/images/alat/mesin-cuci-portable.png",
  "36": "/images/alat/mesin-cuci-portable.png",
  "steamer-garmen": "/images/alat/steamer-garmen.png",
  steamergarmen: "/images/alat/steamer-garmen.png",
  "37": "/images/alat/steamer-garmen.png",
  "dispenser-air-galon": "/images/alat/dispenser-air-galon.png",
  dispenserairgalon: "/images/alat/dispenser-air-galon.png",
  "38": "/images/alat/dispenser-air-galon.png",

  // Pesta & Acara
  "tenda-event": "/images/alat/tenda-event.png",
  "tenda-event-3x3": "/images/alat/tenda-event.png",
  tendaevent: "/images/alat/tenda-event.png",
  "18": "/images/alat/tenda-event.png",
  "sound-system-portable": "/images/alat/sound-system-portable.png",
  soundsystemportable: "/images/alat/sound-system-portable.png",
  "21": "/images/alat/sound-system-portable.png",
  proyektor: "/images/alat/proyektor.png",
  projector: "/images/alat/proyektor.png",
  "22": "/images/alat/proyektor.png",
  "genset-portable": "/images/alat/genset-portable.png",
  "genset-portable-1000w": "/images/alat/genset-portable.png",
  gensetportable: "/images/alat/genset-portable.png",
  "39": "/images/alat/genset-portable.png",
  "lampu-sorot-led": "/images/alat/lampu-sorot-led.png",
  lampusorotled: "/images/alat/lampu-sorot-led.png",
  "40": "/images/alat/lampu-sorot-led.png",
  "backdrop-stand": "/images/alat/backdrop-stand.png",
  backdropstand: "/images/alat/backdrop-stand.png",
  "41": "/images/alat/backdrop-stand.png",
  "chafing-dish": "/images/alat/chafing-dish.png",
  chafingdish: "/images/alat/chafing-dish.png",
  "42": "/images/alat/chafing-dish.png",

  // Kamera & Elektronik
  "tripod-profesional": "/images/alat/tripod-profesional.png",
  tripodprofesional: "/images/alat/tripod-profesional.png",
  "44": "/images/alat/tripod-profesional.png",
  "ring-light-stand": "/images/alat/ring-light-and-stand.png",
  "ring-light-and-stand": "/images/alat/ring-light-and-stand.png",
  ringlightandstand: "/images/alat/ring-light-and-stand.png",
  "45": "/images/alat/ring-light-and-stand.png",
  "gimbal-smartphone": "/images/alat/gimbal-smartphone.png",
  gimbalsmartphone: "/images/alat/gimbal-smartphone.png",
  "46": "/images/alat/gimbal-smartphone.png",
  "action-cam-4k": "/images/alat/action-cam-4k.png",
  actioncam4k: "/images/alat/action-cam-4k.png",
  "47": "/images/alat/action-cam-4k.png",

  // Otomotif & Bengkel
  "dongkrak-buaya": "/images/alat/dongkrak-buaya.png",
  "dongkrak-buaya-2-ton": "/images/alat/dongkrak-buaya.png",
  dongkrakbuaya: "/images/alat/dongkrak-buaya.png",
  "48": "/images/alat/dongkrak-buaya.png",
  "kompresor-udara": "/images/alat/kompresor-udara.png",
  "kompresor-udara-24l": "/images/alat/kompresor-udara.png",
  kompresorudara: "/images/alat/kompresor-udara.png",
  "49": "/images/alat/kompresor-udara.png",
  "toolbox-kunci": "/images/alat/toolbox-kunci.png",
  "toolbox-kunci-108-pcs": "/images/alat/toolbox-kunci.png",
  toolboxkunci: "/images/alat/toolbox-kunci.png",
  "50": "/images/alat/toolbox-kunci.png",
  "jet-cleaner": "/images/alat/jet-cleaner.png",
  "jet-cleaner-cuci-kendaraan": "/images/alat/jet-cleaner.png",
  jetcleaner: "/images/alat/jet-cleaner.png",
  "52": "/images/alat/jet-cleaner.png",

  // Kesehatan & Mobilitas
  "kursi-roda-lipat": "/images/alat/kursi-roda-lipat.png",
  kursirodalipat: "/images/alat/kursi-roda-lipat.png",
  "53": "/images/alat/kursi-roda-lipat.png",
  "walker-lansia": "/images/alat/walker-lansia.png",
  walkerlansia: "/images/alat/walker-lansia.png",
  "54": "/images/alat/walker-lansia.png",
  "kruk-ketiak": "/images/alat/kruk-ketiak.png",
  krukketiak: "/images/alat/kruk-ketiak.png",
  "55": "/images/alat/kruk-ketiak.png",
  "tensimeter-digital": "/images/alat/tensimeter-digital.png",
  tensimeterdigital: "/images/alat/tensimeter-digital.png",
  "56": "/images/alat/tensimeter-digital.png",
  "kasur-anti-dekubitus": "/images/alat/kasur-anti-dekubitus.png",
  kasurantidekubitus: "/images/alat/kasur-anti-dekubitus.png",
  "57": "/images/alat/kasur-anti-dekubitus.png",
};

export function getProductImage(
  slugOrId?: string | number | null,
  dbUrl?: string | null
): string | null {
  if (slugOrId !== undefined && slugOrId !== null) {
    const raw = String(slugOrId).toLowerCase().trim();
    if (LOCAL_PRODUCT_IMAGES[raw]) {
      return LOCAL_PRODUCT_IMAGES[raw];
    }
    const simplified = raw.replace(/[^a-z0-9]/g, "");
    if (LOCAL_PRODUCT_IMAGES[simplified]) {
      return LOCAL_PRODUCT_IMAGES[simplified];
    }
  }
  return dbUrl || null;
}

