/**
 * Pure functions for rental price calculation matching database logic.
 */

export interface PricingItem {
  equipmentId: number;
  qty: number;
  harga_per_hari: number;
  harga_mingguan?: number | null;
  deposit: number;
}

export interface PricingSummary {
  days: number;
  items: Array<{
    equipmentId: number;
    qty: number;
    unitPriceForDuration: number;
    subtotal: number;
    depositSubtotal: number;
  }>;
  totalSewa: number;
  totalDeposit: number;
  dpPersen: number;
  dpJumlah: number;
  sisaPelunasan: number;
  totalKeseluruhan: number; // total sewa + deposit
  sisaSaatAmbil: number; // sisa pelunasan + deposit
}

/**
 * Menghitung selisih hari inklusif antara 2 tanggal (YYYY-MM-DD).
 * Lama sewa = (tanggal_selesai - tanggal_mulai) + 1 hari.
 */
export function calculateRentalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  try {
    const [y1, m1, d1] = startDate.split("-").map(Number);
    const [y2, m2, d2] = endDate.split("-").map(Number);
    if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;

    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);

    if (utc2 < utc1) return 0;

    const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  } catch {
    return 0;
  }
}

/**
 * Menghitung harga per unit untuk durasi sewa tertentu.
 * Jika lama sewa >= 7 hari dan harga_mingguan terisi:
 * harga per unit = (hari div 7) * harga_mingguan + (hari mod 7) * harga_per_hari;
 * selain itu: hari * harga_per_hari.
 */
export function calculateUnitPriceForDuration(
  days: number,
  hargaPerHari: number,
  hargaMingguan?: number | null
): number {
  if (days <= 0) return 0;
  if (days >= 7 && hargaMingguan !== null && hargaMingguan !== undefined && hargaMingguan > 0) {
    const weeks = Math.floor(days / 7);
    const remDays = days % 7;
    return weeks * hargaMingguan + remDays * hargaPerHari;
  }
  return days * hargaPerHari;
}

/**
 * Menghitung ringkasan lengkap harga sewa, DP, dan deposit.
 */
export function calculateRentalPrice(
  items: PricingItem[],
  startDate: string,
  endDate: string,
  dpPersen = 30
): PricingSummary {
  const days = calculateRentalDays(startDate, endDate);

  const calculatedItems = items.map((item) => {
    const unitPriceForDuration = calculateUnitPriceForDuration(
      days,
      item.harga_per_hari,
      item.harga_mingguan
    );
    const subtotal = unitPriceForDuration * item.qty;
    const depositSubtotal = (item.deposit || 0) * item.qty;

    return {
      equipmentId: item.equipmentId,
      qty: item.qty,
      unitPriceForDuration,
      subtotal,
      depositSubtotal,
    };
  });

  const totalSewa = calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalDeposit = calculatedItems.reduce((acc, curr) => acc + curr.depositSubtotal, 0);

  // DP persen diambil dari parameter (default 30%)
  const sanitizedDpPersen = Math.max(0, Math.min(100, dpPersen));
  const dpJumlah = Math.round((sanitizedDpPersen / 100) * totalSewa);
  const sisaPelunasan = Math.max(0, totalSewa - dpJumlah);
  const totalKeseluruhan = totalSewa + totalDeposit;
  const sisaSaatAmbil = sisaPelunasan + totalDeposit;

  return {
    days,
    items: calculatedItems,
    totalSewa,
    totalDeposit,
    dpPersen: sanitizedDpPersen,
    dpJumlah,
    sisaPelunasan,
    totalKeseluruhan,
    sisaSaatAmbil,
  };
}
