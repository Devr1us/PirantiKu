import type {
  Booking,
  BookingItem,
  EquipmentItem,
  Payment,
  PaymentJenis,
  BookingStatusPembayaran,
  BookingReturn,
  DamageReport,
} from "@/types/database";

export interface BookingFinancialDetail {
  totalSewa: number;
  depositTarget: number;
  dpTarget: number;
  pelunasanTarget: number;
  totalKewajibanAwal: number; // totalSewa + depositTarget

  // Realisasi Pembayaran Masuk (Terverifikasi)
  dpTelahDibayar: number;
  pelunasanTelahDibayar: number;
  depositTelahDibayar: number;
  dendaTelahDibayar: number;
  gantiRugiTelahDibayar: number;
  penyesuaianMasuk: number;
  totalMasukTerverifikasi: number;

  // Realisasi Pembayaran Keluar (Terverifikasi)
  refundDepositTelahDibayar: number;
  penyesuaianKeluar: number;
  totalKeluarTerverifikasi: number;

  // Pengembalian & Tagihan Tambahan
  hariTerlambat: number;
  dendaKeterlambatan: number;
  gantiRugiKerusakan: number;
  totalPotonganDeposit: number; // denda + ganti rugi

  // Perhitungan Deposit
  statusDeposit: "ditahan" | "dikembalikan_penuh" | "dipotong_sebagian" | "dipotong_habis" | "kurang_bayar";
  depositSisaSeharusnya: number; // GREATEST(0, depositTarget - totalPotonganDeposit)
  depositSisaPerluRefund: number; // GREATEST(0, depositSisaSeharusnya - refundDepositTelahDibayar)
  kekuranganBayarKerusakan: number; // GREATEST(0, totalPotonganDeposit - depositTarget)

  // Status Finansial Keseluruhan
  saldoBersih: number; // totalMasuk - totalKeluar - (totalSewa + totalPotonganDeposit)
  statusPembayaran: BookingStatusPembayaran;
  isLunasSebelumAmbil: boolean;
  canHandover: boolean;
}

/**
 * Menghitung rincian keuangan lengkap untuk satu booking berdasarkan
 * item, transaksi payments, pengembalian, dan damage reports.
 */
export function calculateBookingFinancials(params: {
  booking: Booking;
  items?: (BookingItem & { equipment?: EquipmentItem | null })[];
  payments?: Payment[];
  returns?:
    | (BookingReturn & { damage_reports?: DamageReport[] })
    | (BookingReturn & { damage_reports?: DamageReport[] })[]
    | null;
  dpPersen?: number;
}): BookingFinancialDetail {
  const { booking, items = [], payments = [], returns, dpPersen = 30 } = params;

  // 1. Total Sewa
  let totalSewa = Number(booking.total_sewa) || 0;
  if (!totalSewa && items.length > 0) {
    totalSewa = items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
  }
  if (!totalSewa) {
    totalSewa = Math.max(0, Number(booking.total_harga || 0) - Number(booking.deposit || 0));
  }

  // 2. Deposit Target & Rencana DP
  const depositTarget = Number(booking.deposit) || 0;
  const dpTarget =
    Number(booking.dp_jumlah) > 0
      ? Number(booking.dp_jumlah)
      : Math.round((dpPersen / 100) * totalSewa);
  const pelunasanTarget = Math.max(0, totalSewa - dpTarget);
  const totalKewajibanAwal = totalSewa + depositTarget;

  // 3. Agregasi Transaksi Terverifikasi
  let dpTelahDibayar = 0;
  let pelunasanTelahDibayar = 0;
  let depositTelahDibayar = 0;
  let dendaTelahDibayar = 0;
  let gantiRugiTelahDibayar = 0;
  let penyesuaianMasuk = 0;
  let totalMasukTerverifikasi = 0;

  let refundDepositTelahDibayar = 0;
  let penyesuaianKeluar = 0;
  let totalKeluarTerverifikasi = 0;

  for (const p of payments) {
    if (p.status !== "terverifikasi") continue;
    const jml = Number(p.jumlah) || 0;
    const arah = p.arah || (p.jenis === "refund_deposit" ? "keluar" : "masuk");

    if (arah === "keluar") {
      totalKeluarTerverifikasi += jml;
      if (p.jenis === "refund_deposit") {
        refundDepositTelahDibayar += jml;
      } else if (p.jenis === "penyesuaian") {
        penyesuaianKeluar += jml;
      }
    } else {
      totalMasukTerverifikasi += jml;
      if (p.jenis === "dp") dpTelahDibayar += jml;
      else if (p.jenis === "pelunasan") pelunasanTelahDibayar += jml;
      else if (p.jenis === "deposit") depositTelahDibayar += jml;
      else if (p.jenis === "denda" || p.jenis === "denda_keterlambatan") dendaTelahDibayar += jml;
      else if (p.jenis === "ganti_rugi") gantiRugiTelahDibayar += jml;
      else if (p.jenis === "penyesuaian") penyesuaianMasuk += jml;
    }
  }

  // 4. Data Pengembalian & Kerusakan
  let hariTerlambat = 0;
  let dendaKeterlambatan = 0;
  let gantiRugiKerusakan = 0;

  const returnList = Array.isArray(returns) ? returns : returns ? [returns] : [];
  for (const ret of returnList) {
    hariTerlambat += Number(ret.hari_terlambat) || 0;
    dendaKeterlambatan += Number(ret.denda_terlambat) || 0;
    gantiRugiKerusakan += Number(ret.total_ganti_rugi) || 0;

    if (ret.damage_reports && Array.isArray(ret.damage_reports)) {
      const damageTotal = ret.damage_reports.reduce(
        (sum, dm) => sum + (Number(dm.biaya_ganti_rugi) || 0),
        0
      );
      if (damageTotal > gantiRugiKerusakan) {
        gantiRugiKerusakan = damageTotal;
      }
    }
  }

  const totalPotonganDeposit = dendaKeterlambatan + gantiRugiKerusakan;
  const depositSisaSeharusnya = Math.max(0, depositTarget - totalPotonganDeposit);
  const depositSisaPerluRefund = Math.max(0, depositSisaSeharusnya - refundDepositTelahDibayar);
  const kekuranganBayarKerusakan = Math.max(0, totalPotonganDeposit - depositTarget);

  // Status Deposit
  let statusDeposit: BookingFinancialDetail["statusDeposit"] = "ditahan";
  if (returnList.length > 0 || booking.status === "dikembalikan" || booking.status === "selesai") {
    if (kekuranganBayarKerusakan > 0) {
      statusDeposit = "kurang_bayar";
    } else if (totalPotonganDeposit === 0) {
      statusDeposit = refundDepositTelahDibayar >= depositTarget ? "dikembalikan_penuh" : "ditahan";
    } else if (depositSisaSeharusnya === 0) {
      statusDeposit = "dipotong_habis";
    } else {
      statusDeposit = "dipotong_sebagian";
    }
  }

  // Status Pembayaran Keseluruhan
  // Total kewajiban keseluruhan = totalSewa + totalPotonganDeposit (atau depositTarget jika belum pengembalian)
  const isReturned =
    booking.status === "dikembalikan" ||
    booking.status === "bermasalah" ||
    booking.status === "selesai" ||
    returnList.length > 0;

  let statusPembayaran: BookingStatusPembayaran = "belum_bayar";

  if (booking.status === "dibatalkan") {
    if (totalMasukTerverifikasi > 0 && totalKeluarTerverifikasi < totalMasukTerverifikasi) {
      statusPembayaran = "menunggu_refund";
    } else if (totalMasukTerverifikasi > 0 && totalKeluarTerverifikasi >= totalMasukTerverifikasi) {
      statusPembayaran = "selesai";
    } else {
      statusPembayaran = "belum_bayar";
    }
  } else if (totalMasukTerverifikasi === 0) {
    statusPembayaran = "belum_bayar";
  } else if (!isReturned) {
    // Belum pengembalian
    if (totalMasukTerverifikasi >= totalKewajibanAwal) {
      statusPembayaran = "lunas";
    } else if (dpTelahDibayar >= dpTarget || totalMasukTerverifikasi >= dpTarget) {
      statusPembayaran = "dp_dibayar";
    } else {
      statusPembayaran = "belum_bayar";
    }
  } else {
    // Sudah pengembalian
    if (depositSisaPerluRefund > 0) {
      statusPembayaran = "menunggu_refund";
    } else if (
      totalMasukTerverifikasi >= totalSewa + Math.min(depositTarget, totalPotonganDeposit) &&
      (kekuranganBayarKerusakan === 0 ||
        dendaTelahDibayar + gantiRugiTelahDibayar >= kekuranganBayarKerusakan)
    ) {
      statusPembayaran = "selesai";
    } else {
      statusPembayaran = "dp_dibayar";
    }
  }

  // Saldo bersih (Harus 0 ketika booking selesai sepenuhnya)
  const totalBebanKustomer = totalSewa + totalPotonganDeposit;
  const saldoBersih = totalMasukTerverifikasi - totalKeluarTerverifikasi - totalBebanKustomer;

  // Syarat serah terima alat: DP terverifikasi & pelunasan + deposit lunas
  const isLunasSebelumAmbil = totalMasukTerverifikasi >= totalKewajibanAwal;
  const canHandover = dpTelahDibayar >= dpTarget || totalMasukTerverifikasi >= dpTarget;

  return {
    totalSewa,
    depositTarget,
    dpTarget,
    pelunasanTarget,
    totalKewajibanAwal,
    dpTelahDibayar,
    pelunasanTelahDibayar,
    depositTelahDibayar,
    dendaTelahDibayar,
    gantiRugiTelahDibayar,
    penyesuaianMasuk,
    totalMasukTerverifikasi,
    refundDepositTelahDibayar,
    penyesuaianKeluar,
    totalKeluarTerverifikasi,
    hariTerlambat,
    dendaKeterlambatan,
    gantiRugiKerusakan,
    totalPotonganDeposit,
    statusDeposit,
    depositSisaSeharusnya,
    depositSisaPerluRefund,
    kekuranganBayarKerusakan,
    saldoBersih,
    statusPembayaran,
    isLunasSebelumAmbil,
    canHandover,
  };
}

/**
 * Konfigurasi badge dan label status pembayaran
 */
export const PAYMENT_STATUS_BADGES: Record<
  BookingStatusPembayaran,
  { label: string; bg: string; text: string; border: string; dot: string; description: string }
> = {
  belum_bayar: {
    label: "Belum Bayar",
    bg: "bg-[#FEF3C7]",
    text: "text-[#78350F]",
    border: "border-[#FDE68A]",
    dot: "bg-[#D97706]",
    description: "Pelanggan belum membayar uang muka (DP).",
  },
  dp_dibayar: {
    label: "DP Terbayar",
    bg: "bg-[#E0F2FE]",
    text: "text-[#0369A1]",
    border: "border-[#BAE6FD]",
    dot: "bg-[#0284C7]",
    description: "DP terverifikasi. Sisa pelunasan & deposit belum lunas.",
  },
  lunas: {
    label: "Lunas",
    bg: "bg-[#E2F0D9]",
    text: "text-[#2E5E4E]",
    border: "border-[#C5E1A5]",
    dot: "bg-[#2E5E4E]",
    description: "Biaya sewa dan uang jaminan (deposit) telah lunas 100%.",
  },
  menunggu_refund: {
    label: "Menunggu Refund",
    bg: "bg-[#EDE9FE]",
    text: "text-[#5B21B6]",
    border: "border-[#DDD6FE]",
    dot: "bg-[#7C3AED]",
    description: "Terdapat sisa deposit atau dana yang perlu ditransfer kembali ke pelanggan.",
  },
  selesai: {
    label: "Selesai",
    bg: "bg-[#F3F4F6]",
    text: "text-[#374151]",
    border: "border-[#E5E7EB]",
    dot: "bg-[#4B5563]",
    description: "Seluruh kewajiban finansial selesai dan saldo bersih Rp 0.",
  },
};

/**
 * Format label jenis transaksi
 */
export const PAYMENT_JENIS_LABELS: Record<PaymentJenis, string> = {
  dp: "Uang Muka (DP)",
  pelunasan: "Pelunasan Sewa",
  deposit: "Uang Jaminan (Deposit)",
  denda: "Denda Keterlambatan",
  denda_keterlambatan: "Denda Keterlambatan",
  ganti_rugi: "Ganti Rugi Kerusakan",
  refund_deposit: "Pengembalian Deposit",
  penyesuaian: "Koreksi / Penyesuaian",
};

/**
 * Menghitung arah transaksi secara andal (fallback ke jenis jika kolom arah belum ada)
 */
export function getPaymentArah(p: {
  arah?: string | null;
  jenis?: string | null;
}): "masuk" | "keluar" {
  if (p.arah === "keluar" || p.arah === "masuk") {
    return p.arah;
  }
  return p.jenis === "refund_deposit" ? "keluar" : "masuk";
}

/**
 * Menentukan timestamp transaksi yang valid (fallback tanggal_transaksi -> dibayar_pada -> created_at)
 */
export function getPaymentTransactionDate(p: {
  tanggal_transaksi?: string | null;
  dibayar_pada?: string | null;
  created_at?: string | null;
}): string {
  return p.tanggal_transaksi || p.dibayar_pada || p.created_at || new Date().toISOString();
}

/**
 * Mengubah ISO string menjadi format tanggal YYYY-MM-DD dalam zona waktu WIB (Asia/Jakarta, UTC+7)
 */
export function toWibDateString(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Mendapatkan rentang waktu presisi dalam zona waktu WIB (UTC+7)
 */
export function getWibDateRange(
  period: string,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const wibToday = toWibDateString(now.toISOString());
  const [yearStr, monthStr, dayStr] = (wibToday || "2026-11-23").split("-");

  let startDate: Date;
  let endDate: Date;

  if (period === "hari_ini") {
    startDate = new Date(`${yearStr}-${monthStr}-${dayStr}T00:00:00.000+07:00`);
    endDate = new Date(`${yearStr}-${monthStr}-${dayStr}T23:59:59.999+07:00`);
  } else if (period === "7_hari") {
    const todayEnd = new Date(`${yearStr}-${monthStr}-${dayStr}T23:59:59.999+07:00`);
    startDate = new Date(todayEnd.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);
    endDate = todayEnd;
  } else if (period === "bulan_ini") {
    startDate = new Date(`${yearStr}-${monthStr}-01T00:00:00.000+07:00`);
    // Akhir bulan WIB
    const nextMonth = Number(monthStr) === 12 ? 1 : Number(monthStr) + 1;
    const nextYear = Number(monthStr) === 12 ? Number(yearStr) + 1 : Number(yearStr);
    const nextMonthStr = String(nextMonth).padStart(2, "0");
    const firstOfNextMonth = new Date(`${nextYear}-${nextMonthStr}-01T00:00:00.000+07:00`);
    endDate = new Date(firstOfNextMonth.getTime() - 1);
  } else if (period === "kustom" && customStart && customEnd) {
    startDate = new Date(`${customStart}T00:00:00.000+07:00`);
    endDate = new Date(`${customEnd}T23:59:59.999+07:00`);
  } else {
    // Default: bulan_ini
    startDate = new Date(`${yearStr}-${monthStr}-01T00:00:00.000+07:00`);
    endDate = new Date();
  }

  return { startDate, endDate };
}
