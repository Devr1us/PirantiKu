import { formatRupiah } from "./format";

/**
 * Kompresi gambar client-side menggunakan HTML5 Canvas
 * Menghasilkan data URL JPEG berkualitas tinggi dengan ukuran file yang ringkas (~80KB - 180KB).
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Gambar latar putih (menghindari background hitam pada png transparan)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Parsing string rekening seperti "BCA 1234567890 a/n PirantiKu"
 */
export function parseBankAccount(rekeningStr?: string): {
  bank: string;
  nomor: string;
  atasNama: string;
} {
  const fallback = {
    bank: "BCA",
    nomor: "1234567890",
    atasNama: "PirantiKu",
  };

  if (!rekeningStr) return fallback;

  // Format umum: "BCA 1234567890 a/n PirantiKu" atau "BCA 1234567890 a.n. PirantiKu"
  const regex = /^([A-Za-z0-9\s]+?)\s+([0-9\s-]+?)(?:\s+(?:a\/n|a\.n\.|an)\s+(.+))?$/i;
  const match = rekeningStr.trim().match(regex);

  if (match) {
    return {
      bank: match[1]?.trim() || fallback.bank,
      nomor: match[2]?.replace(/[^0-9]/g, "") || fallback.nomor,
      atasNama: match[3]?.trim() || fallback.atasNama,
    };
  }

  // Fallback pemisah spasi
  const parts = rekeningStr.split(/\s+/);
  return {
    bank: parts[0] || fallback.bank,
    nomor: parts[1] || fallback.nomor,
    atasNama: parts.slice(2).join(" ").replace(/^(a\/n|a\.n\.)\s*/i, "") || fallback.atasNama,
  };
}

/**
 * Menghitung batas waktu pembayaran (default 24 jam dari created_at)
 */
export function getPaymentCountdown(
  createdAtStr: string,
  hoursValid = 24
): {
  isExpired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const created = new Date(createdAtStr).getTime();
  const deadline = created + hoursValid * 60 * 60 * 1000;
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) {
    return {
      isExpired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Waktu Habis",
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    isExpired: false,
    hours,
    minutes,
    seconds,
    formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

/**
 * Generator pesan WhatsApp otomatis konfirmasi pembayaran
 */
export function generateWhatsAppPaymentMessage({
  bookingCode,
  customerName,
  dpAmount,
  method,
  senderName,
  startDate,
  endDate,
}: {
  bookingCode: string;
  customerName: string;
  dpAmount: number;
  method: string;
  senderName?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const dateInfo = startDate && endDate ? `\n- Periode Sewa: ${startDate} s/d ${endDate}` : "";
  const senderInfo = senderName ? `\n- Pengirim: ${senderName}` : "";

  const text = `Halo Admin PirantiKu,
Saya ingin konfirmasi pembayaran Uang Muka (DP) untuk booking alat:

- Kode Booking: *${bookingCode}*
- Nama Pemesan: *${customerName}*
- Nominal DP: *${formatRupiah(dpAmount)}*
- Metode Pembayaran: *${method}*${senderInfo}${dateInfo}

Bukti transfer sudah saya unggah melalui website PirantiKu. Mohon bantuannya untuk diperiksa dan diverifikasi. Terima kasih!`;

  return encodeURIComponent(text);
}
