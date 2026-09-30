import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format angka ke mata uang Rupiah standar Indonesia.
 * Contoh: formatRupiah(50000) => "Rp 50.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format string atau Date ke format tanggal Indonesia menggunakan date-fns.
 * Bawaan: "dd MMMM yyyy" -> "12 Oktober 2026"
 */
export function formatDateIndo(
  dateInput: string | Date | null | undefined,
  formatPattern = "d MMMM yyyy"
): string {
  if (!dateInput) return "-";

  let parsedDate: Date;
  if (typeof dateInput === "string") {
    // Tangani format YYYY-MM-DD agar tidak tergeser zona waktu
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split("-").map(Number);
      parsedDate = new Date(year, month - 1, day);
    } else {
      parsedDate = parseISO(dateInput);
    }
  } else {
    parsedDate = dateInput;
  }

  if (!isValid(parsedDate)) return "-";

  return format(parsedDate, formatPattern, { locale: id });
}

/**
 * Format rentang tanggal sewa.
 * Contoh: "12 Okt 2026 - 14 Okt 2026 (3 hari)"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "-";
  const startStr = formatDateIndo(startDate, "d MMM yyyy");
  const endStr = formatDateIndo(endDate, "d MMM yyyy");
  return `${startStr} - ${endStr}`;
}

/**
 * Mengubah teks key spesifikasi dari snake_case menjadi Title Case.
 * Contoh: "daya_listrik" => "Daya Listrik"
 */
export function formatSpecKey(key: string): string {
  if (!key) return "";
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Menstandarkan nomor HP Indonesia (08xx -> 628xx untuk link WA)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}
