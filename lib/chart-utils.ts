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

export interface XAxisTick {
  index: number;
  label: string;
  isMonthStart?: boolean;
}

export const BULAN_INDO = [
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

export const BULAN_PENDEK = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

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

  const cleanDari = dari.substring(0, 10);
  const cleanSampai = sampai.substring(0, 10);

  const [yStart, mStart, dStart] = cleanDari.split("-").map(Number);
  const [yEnd, mEnd, dEnd] = cleanSampai.split("-").map(Number);

  if (isNaN(yStart) || isNaN(mStart) || isNaN(dStart) || isNaN(yEnd) || isNaN(mEnd) || isNaN(dEnd)) {
    return [];
  }

  // Gunakan Date.UTC murni untuk iterasi per hari (24 jam = 86400000 ms)
  let currTime = Date.UTC(yStart, mStart - 1, dStart);
  let endTime = Date.UTC(yEnd, mEnd - 1, dEnd);

  // Jika input terbalik (dari > sampai), swap secara aman agar tidak menghasilkan loop kosong
  if (currTime > endTime) {
    const temp = currTime;
    currTime = endTime;
    endTime = temp;
  }

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
 * Menghitung label sumbu X cerdas yang tidak pernah bertumpuk,
 * baik untuk rentang 1 hari, 7 hari, 1 bulan, hingga multi-bulan/1 tahun penuh.
 */
export function hitungLabelSumbuX(items: DailyChartItem[]): XAxisTick[] {
  const totalDays = items.length;
  if (totalDays === 0) return [];
  if (totalDays === 1) {
    const p = items[0].tanggal.split("-");
    return [{ index: 0, label: p.length === 3 ? `${p[2]}/${p[1]}` : items[0].tanggal }];
  }

  // 1. Rentang sangat pendek (<= 10 hari): Tampilkan semua hari (dd/MM)
  if (totalDays <= 10) {
    return items.map((item, idx) => {
      const p = item.tanggal.split("-");
      return { index: idx, label: `${p[2]}/${p[1]}` };
    });
  }

  // 2. Rentang 11 - 31 hari (misal 1 bulan): Stepping 2-4 hari (menghasilkan 6-9 label)
  if (totalDays <= 31) {
    const step = totalDays <= 18 ? 2 : totalDays <= 25 ? 3 : 4;
    const ticks: XAxisTick[] = [];
    for (let i = 0; i < totalDays; i += step) {
      const p = items[i].tanggal.split("-");
      ticks.push({ index: i, label: `${p[2]}/${p[1]}` });
    }
    const lastIdx = totalDays - 1;
    if (lastIdx - ticks[ticks.length - 1].index >= Math.floor(step / 2)) {
      const p = items[lastIdx].tanggal.split("-");
      ticks.push({ index: lastIdx, label: `${p[2]}/${p[1]}` });
    }
    return ticks;
  }

  // 3. Rentang 32 - 90 hari (1-3 bulan): Stepping 7-10 hari dengan format tanggal & bulan ringkas (misal: "01 Okt", "15 Okt")
  if (totalDays <= 90) {
    const step = Math.ceil(totalDays / 7);
    const ticks: XAxisTick[] = [];
    for (let i = 0; i < totalDays; i += step) {
      const p = items[i].tanggal.split("-");
      const mIdx = parseInt(p[1], 10) - 1;
      ticks.push({ index: i, label: `${p[2]} ${BULAN_PENDEK[mIdx] || p[1]}` });
    }
    const lastIdx = totalDays - 1;
    if (lastIdx - ticks[ticks.length - 1].index >= Math.floor(step / 2)) {
      const p = items[lastIdx].tanggal.split("-");
      const mIdx = parseInt(p[1], 10) - 1;
      ticks.push({ index: lastIdx, label: `${p[2]} ${BULAN_PENDEK[mIdx] || p[1]}` });
    }
    return ticks;
  }

  // 4. Rentang panjang (> 90 hari hingga 1 tahun ke atas, seperti kasus 01/01/2026 s/d 30/11/2026):
  // Kelompokkan berdasarkan batas awal setiap bulan (Jan, Feb, Mar, ...)
  const monthTransitions: { index: number; monthKey: string; year: string; monthIdx: number }[] = [];
  let prevMonth = "";
  items.forEach((item, idx) => {
    const [y, m] = item.tanggal.split("-");
    const monthKey = `${y}-${m}`;
    if (monthKey !== prevMonth) {
      monthTransitions.push({
        index: idx,
        monthKey,
        year: y,
        monthIdx: parseInt(m, 10) - 1,
      });
      prevMonth = monthKey;
    }
  });

  const totalMonths = monthTransitions.length;

  // Jika jumlah bulan <= 12 (rentang setahun): tampilkan setiap bulan
  if (totalMonths <= 12) {
    const uniqueYears = new Set(monthTransitions.map((m) => m.year));
    const showYear = uniqueYears.size > 1;

    return monthTransitions.map((mt) => {
      const name = BULAN_PENDEK[mt.monthIdx] || mt.monthKey;
      return {
        index: mt.index,
        label: showYear ? `${name} '${mt.year.slice(2)}` : name,
        isMonthStart: true,
      };
    });
  }

  // Jika rentang multi-tahun (> 12 bulan): ambil setiap 2 atau 3 bulan agar tidak bertumpuk
  const monthStep = Math.ceil(totalMonths / 10);
  const ticks: XAxisTick[] = [];
  for (let i = 0; i < totalMonths; i += monthStep) {
    const mt = monthTransitions[i];
    const name = BULAN_PENDEK[mt.monthIdx] || mt.monthKey;
    ticks.push({
      index: mt.index,
      label: `${name} '${mt.year.slice(2)}`,
      isMonthStart: true,
    });
  }
  return ticks;
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

/**
 * Format tanggal Indonesia ringkas untuk badge periode (misal: "23 Nov 2026")
 */
export function formatTanggalIndoRingkas(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.substring(0, 10).split("-");
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const namaBulan = BULAN_PENDEK[monthIdx] || parts[1];
  return `${day} ${namaBulan} ${year}`;
}
