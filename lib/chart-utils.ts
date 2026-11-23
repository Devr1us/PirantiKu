/**
 * Helper & utility functions untuk pembuatan grafik tren keuangan PirantiKu
 */

export interface DailyChartItem {
  tanggal: string; // Format ISO Date: YYYY-MM-DD (WIB)
  total: number;   // Nominal uang masuk (IDR)
}

export interface GenericChartDataPoint {
  tanggal?: string;
  date?: string;
  total?: number;
  amount?: number;
}

/**
 * Mengisi seluruh hari dalam rentang [dari, sampai] termasuk hari dengan transaksi 0.
 * Menggunakan aritmatika UTC murni pada string tanggal (YYYY-MM-DD)
 * agar aman dari pergeseran zona waktu lokal browser/server.
 */
export function isiHariKosong(
  data: GenericChartDataPoint[] = [],
  dari: string,
  sampai: string
): DailyChartItem[] {
  if (!dari || !sampai) {
    return [];
  }

  // Agregasi seluruh data ke dalam map berdasarkan string tanggal (YYYY-MM-DD)
  const dataMap = new Map<string, number>();
  for (const item of data) {
    const rawTgl = item.tanggal || item.date;
    if (!rawTgl) continue;

    // Normalisasi format jika ada timestamp (ambil 10 karakter pertama: YYYY-MM-DD)
    const tgl = rawTgl.substring(0, 10);
    const nominal = Number(item.total ?? item.amount ?? 0) || 0;
    dataMap.set(tgl, (dataMap.get(tgl) || 0) + nominal);
  }

  const [yStart, mStart, dStart] = dari.split("-").map(Number);
  const [yEnd, mEnd, dEnd] = sampai.split("-").map(Number);

  if (isNaN(yStart) || isNaN(mStart) || isNaN(dStart) || isNaN(yEnd) || isNaN(mEnd) || isNaN(dEnd)) {
    return [];
  }

  // Gunakan Date.UTC murni untuk iterasi per hari (24 jam = 86400000 ms)
  let currTime = Date.UTC(yStart, mStart - 1, dStart);
  const endTime = Date.UTC(yEnd, mEnd - 1, dEnd);

  const result: DailyChartItem[] = [];

  while (currTime <= endTime) {
    const d = new Date(currTime);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const tglStr = `${y}-${m}-${day}`;

    result.push({
      tanggal: tglStr,
      total: dataMap.get(tglStr) || 0,
    });

    currTime += 24 * 60 * 60 * 1000;
  }

  return result;
}

/**
 * Menghitung batas maksimum sumbu Y yang dibulatkan ke angka "bagus" (nice number)
 * dengan 4 interval sama rata (5 ticks: 0, 1x, 2x, 3x, 4x).
 * Contoh: maxAmount Rp 508.800 -> niceMax Rp 600.000 dengan step Rp 150.000.
 */
export function hitungBatasSumbuY(maxAmount: number): {
  maxAxis: number;
  step: number;
  ticks: number[];
} {
  const safeMax = Math.max(0, Number(maxAmount) || 0);

  if (safeMax <= 0) {
    return {
      maxAxis: 100000,
      step: 25000,
      ticks: [0, 25000, 50000, 75000, 100000],
    };
  }

  // 4 interval horizontal
  const rawStep = safeMax / 4;
  const exponent = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const fraction = rawStep / exponent;

  let niceFraction = 10;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 1.25) niceFraction = 1.25;
  else if (fraction <= 1.5) niceFraction = 1.5;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  const step = Math.round(niceFraction * exponent);
  const maxAxis = step * 4;

  const ticks: number[] = [0, step, step * 2, step * 3, maxAxis];

  return {
    maxAxis,
    step,
    ticks,
  };
}

/**
 * Format nominal Rupiah ringkas untuk label sumbu Y (misal: "Rp 150 rb", "Rp 1,2 jt", "Rp 0")
 */
export function formatRupiahRingkas(amount: number): string {
  const safeVal = Number(amount) || 0;
  if (safeVal === 0) return "Rp 0";

  const abs = Math.abs(safeVal);
  if (abs >= 1_000_000_000) {
    const val = safeVal / 1_000_000_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",");
    return `Rp ${formatted} M`;
  }
  if (abs >= 1_000_000) {
    const val = safeVal / 1_000_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",");
    return `Rp ${formatted} jt`;
  }
  if (abs >= 1_000) {
    const val = safeVal / 1_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(".", ",");
    return `Rp ${formatted} rb`;
  }

  return `Rp ${safeVal.toLocaleString("id-ID")}`;
}

const BULAN_INDO = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Format tanggal Indonesia lengkap tanpa dependensi timezone lokal browser.
 * Contoh: "2026-11-23" -> "23 November 2026"
 */
export function formatTanggalIndoPenuh(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const namaBulan = BULAN_INDO[monthIdx] || parts[1];
  return `${day} ${namaBulan} ${year}`;
}
