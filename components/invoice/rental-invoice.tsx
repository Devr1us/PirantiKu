"use client";

import * as React from "react";
import { Printer, MessageCircle, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { createWhatsAppLink } from "@/lib/payment-utils";
import { Wordmark } from "@/components/ui/wordmark";
import { APP_NAME, TAGLINE, LOKASI_DEFAULT, DEFAULT_SETTINGS, normalizeAdminPhone } from "@/lib/constants";
import type { BookingStatus, BookingReturn, DamageReport } from "@/types/database";

export interface InvoiceBookingItem {
  id: number;
  qty: number;
  harga_per_hari: number;
  subtotal: number;
  equipment?: {
    nama: string;
    kategori?: string;
  } | null;
}

export interface RentalInvoiceData {
  id: string;
  kode_booking: string;
  status: BookingStatus;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_harga: number;
  deposit: number;
  dp_jumlah: number;
  catatan_penyewa?: string | null;
  pesan_admin?: string | null;
  created_at: string;
  customer?: {
    nama: string;
    no_hp?: string;
    alamat?: string;
  } | null;
  items: InvoiceBookingItem[];
  settings?: {
    alamat?: string;
    whatsapp_admin?: string;
    jam_operasional?: string;
  };
  returnReport?: (BookingReturn & { damage_reports?: DamageReport[] }) | null;
}

interface RentalInvoiceProps {
  data: RentalInvoiceData;
  onClose?: () => void;
  showPrintButton?: boolean;
}

export function RentalInvoice({
  data,
  onClose,
  showPrintButton = true,
}: RentalInvoiceProps) {
  const handlePrint = () => {
    window.print();
  };

  const customerName = data.customer?.nama || "User";
  const customerPhone = data.customer?.no_hp || "-";
  const customerAddress = data.customer?.alamat || "Alamat belum dilengkapi";

  const storeAddress = data.settings?.alamat || LOKASI_DEFAULT.alamat;
  const storePhone = normalizeAdminPhone(data.settings?.whatsapp_admin);
  const storeHours = data.settings?.jam_operasional || DEFAULT_SETTINGS.jam_operasional;

  // Hitung durasi hari
  const startDate = new Date(data.tanggal_mulai);
  const endDate = new Date(data.tanggal_selesai);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const durasiHari = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const totalTagihan = data.total_harga + data.deposit;
  const sisaPelunasan = Math.max(0, totalTagihan - data.dp_jumlah);

  const isDpPaid =
    data.status === "dp_dibayar" ||
    data.status === "lunas" ||
    data.status === "diambil" ||
    data.status === "dikembalikan" ||
    data.status === "selesai";

  return (
    <div className="bg-white text-[#234E5C] text-xs leading-relaxed max-w-3xl mx-auto p-3.5 sm:p-8 font-sans print:p-0 print:max-w-none print:text-black w-full overflow-hidden">
      {/* Tombol Aksi Kontrol (Disembunyikan saat mencetak) */}
      {showPrintButton && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[#E8E8E1] print:hidden">
          <div className="space-y-0.5">
            <h2 className="text-xs sm:text-sm font-bold text-[#234E5C]">
              Pratinjau Surat Perjanjian &amp; Invoice Resmi
            </h2>
            <p className="text-[11px] text-[#5F7A84]">
              Dokumen bukti booking dan serah terima unit yang sah
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="warm"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none font-bold text-xs gap-1.5 shadow-sm justify-center"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Simpan PDF</span>
            </Button>

            {storePhone && (
              <a
                href={createWhatsAppLink(
                  storePhone,
                  `Halo Admin PirantiKu, saya ingin mengonfirmasi booking #${data.kode_booking} atas nama ${customerName}. Status saat ini: ${data.status}. Terima kasih!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full font-bold text-xs border-[#E8E8E1] text-[#2E5E4E] hover:bg-[#E2F0D9] justify-center"
                >
                  <span>WhatsApp Admin</span>
                </Button>
              </a>
            )}

            {onClose && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Tutup
              </Button>
            )}
          </div>
        </div>
      )}

      {/* DOKUMEN CETAK UTAMA */}
      <div className="border border-[#E8E8E1] rounded-xl p-4 sm:p-8 bg-white print:border-none print:p-0 space-y-6 overflow-hidden">
        {/* 1. KOP SURAT RESMI */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-[#234E5C] pb-5">
          <div className="space-y-1 max-w-sm min-w-0">
            <Wordmark asLink={false} />
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#A0630F]">
              {TAGLINE}
            </p>
            <p className="text-[11px] text-[#5F7A84] pt-1 leading-snug break-words">
              {storeAddress}
            </p>
            <p className="text-[11px] text-[#5F7A84] break-words">
              WhatsApp: <strong>+{storePhone}</strong> | Jam Operasional: {storeHours}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 min-w-0">
            <span className="inline-block px-3 py-1 bg-[#234E5C] text-white font-extrabold text-[11px] sm:text-xs tracking-wider uppercase rounded-sm">
              SURAT PERJANJIAN &amp; INVOICE
            </span>
            <p className="font-mono text-sm sm:text-base font-bold text-[#234E5C] break-all">
              #{data.kode_booking}
            </p>
            <p className="text-[11px] text-[#5F7A84]">
              Tgl Terbit: {formatDateIndo(data.created_at, "d MMMM yyyy")}
            </p>
            <div className="pt-1">
              <span
                className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isDpPaid
                    ? "bg-[#E2F0D9] text-[#2E5E4E] border-[#C5E1A5]"
                    : "bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]"
                }`}
              >
                {isDpPaid ? "✓ DP TERVERIFIKASI" : "MENUNGGU DP / VERIFIKASI"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. DATA IDENTITAS & JADWAL SEWA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1] text-xs">
          {/* Kolom Kiri: Pihak Pertama (User) */}
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0630F] block">
              Pihak Pertama (User)
            </span>
            <p className="font-bold text-sm text-[#234E5C] break-words">{customerName}</p>
            <p className="text-[#5F7A84] break-words">
              No. Kontak / WA: <strong className="text-[#234E5C]">{customerPhone}</strong>
            </p>
            <p className="text-[#5F7A84] leading-snug break-words">
              Alamat: <span className="text-[#234E5C]">{customerAddress}</span>
            </p>
          </div>

          {/* Kolom Kanan: Jadwal Waktu Sewa */}
          <div className="space-y-1.5 sm:border-l sm:border-[#E8E8E1] sm:pl-4 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0630F] block">
              Jadwal Peminjaman Alat
            </span>
            <p className="text-[#5F7A84] break-words">
              Tanggal Pengambilan:{" "}
              <strong className="text-[#234E5C]">
                {formatDateIndo(data.tanggal_mulai, "d MMMM yyyy")}
              </strong>
            </p>
            <p className="text-[#5F7A84] break-words">
              Batas Pengembalian:{" "}
              <strong className="text-[#234E5C]">
                {formatDateIndo(data.tanggal_selesai, "d MMMM yyyy")}
              </strong>
            </p>
            <p className="text-[#5F7A84] break-words">
              Durasi Sewa:{" "}
              <strong className="text-[#234E5C]">{durasiHari} Hari Kalender</strong>
            </p>
          </div>
        </div>

        {/* 3. TABEL PERALATAN SEWA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Daftar Peralatan yang Disewa
            </span>
            <span className="text-[10px] font-medium text-[#5F7A84] sm:hidden flex items-center gap-1">
              Geser tabel &rarr;
            </span>
          </div>
          <div className="w-full overflow-x-auto rounded-lg border border-[#E8E8E1] print:border-none print:overflow-visible">
            <table className="w-full min-w-[500px] text-left text-xs border-collapse">
              <thead className="bg-[#FAFAF8] border-b border-[#E8E8E1] text-[10px] uppercase font-bold text-[#5F7A84] whitespace-nowrap">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Alat &amp; Perlengkapan</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Tarif / Hari</th>
                  <th className="py-2.5 px-3 text-right">Durasi</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E1]">
                {data.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2.5 px-3 text-center font-bold text-[#5F7A84]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#234E5C] break-words">
                      {item.equipment?.nama || "Peralatan Rental"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[#234E5C] whitespace-nowrap">
                      {item.qty} unit
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5F7A84] whitespace-nowrap">
                      {formatRupiah(item.harga_per_hari)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5F7A84] whitespace-nowrap">
                      {durasiHari} hari
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#234E5C] whitespace-nowrap">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. RINCIAN BIAYA & PEMBAYARAN */}
        <div className="flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-80 space-y-2 p-3.5 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1] text-xs">
            <div className="flex justify-between items-center text-[#5F7A84]">
              <span>Total Sewa Alat:</span>
              <span className="font-bold text-[#234E5C]">
                {formatRupiah(data.total_harga)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#5F7A84]">
              <span>Deposit Jaminan (Kembali):</span>
              <span className="font-bold text-[#234E5C]">
                {formatRupiah(data.deposit)}
              </span>
            </div>
            <div className="border-t border-[#E8E8E1] pt-1.5 flex justify-between items-center font-bold text-[#234E5C]">
              <span>Total Tagihan:</span>
              <span>{formatRupiah(totalTagihan)}</span>
            </div>
            <div className="flex justify-between items-center text-[#2E5E4E] font-bold">
              <span>Uang Muka (DP) 30%:</span>
              <span>- {formatRupiah(data.dp_jumlah)}</span>
            </div>
            <div className="border-t-2 border-[#234E5C] pt-2 flex justify-between items-center font-extrabold text-[#A0630F] text-sm">
              <span>Sisa Saat Serah Terima:</span>
              <span>{formatRupiah(sisaPelunasan)}</span>
            </div>
          </div>
        </div>

        {/* 5. KLAUSUL SURAT PERJANJIAN SEWA (HUKUM & LEGALITAS TOKO) */}
        <div className="rounded-lg border border-[#E8E8E1] p-4 bg-[#FAFAF8]/60 space-y-2 text-[10px] text-[#5F7A84] leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-[#234E5C] block text-[11px]">
            Ketentuan & Surat Perjanjian Sewa Unit:
          </span>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <strong>Pemeriksaan Fisik:</strong> User telah memeriksa secara langsung dan memastikan seluruh unit peralatan yang disewa dalam kondisi normal, prima, bersih, dan lengkap aksesorisnya saat serah terima.
            </li>
            <li>
              <strong>Tanggung Jawab Kerusakan / Kehilangan:</strong> User bertanggung jawab penuh atas segala bentuk kerusakan akibat kelalaian pemakaian, benturan, terbakar, maupun kehilangan unit selama masa sewa berlangsung dan bersedia mengganti biaya perbaikan atau unit baru.
            </li>
            <li>
              <strong>Keterlambatan Pengembalian:</strong> Pengembalian melewati batas tanggal/jam sewa yang telah disepakati dikenakan denda keterlambatan sebesar <strong>Rp 50.000 / hari</strong> per alat.
            </li>
            <li>
              <strong>Pengembalian Deposit:</strong> Uang jaminan (deposit) akan dikembalikan penuh 100% saat alat dikembalikan tepat waktu dan dinyatakan lolos inspeksi fisik oleh petugas PirantiKu.
            </li>
          </ol>
        </div>

        {/* 6. BERITA ACARA PENGEMBALIAN & PENYELESAIAN JAMINAN DEPOSIT (JIKA SUDAH SELESAI) */}
        {data.returnReport && (
          <div className="rounded-lg border-2 border-[#234E5C]/30 p-4 bg-[#FAFAF8] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#234E5C]/20 pb-2">
              <span className="font-bold uppercase tracking-wider text-[#234E5C] text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#2E5E4E]" />
                Berita Acara Pengembalian & Inspeksi Fisik
              </span>
              <span className="text-[10px] font-bold text-[#5F7A84]">
                Dikembalikan: {formatDateIndo(data.returnReport.tanggal_dikembalikan, "d MMMM yyyy, HH:mm")} WIB
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-white border border-[#E8E8E1]">
                <span className="text-[#5F7A84] block text-[9px] font-bold uppercase">Keterlambatan</span>
                <span className="font-extrabold text-[#234E5C] block">
                  {data.returnReport.hari_terlambat > 0 ? `${data.returnReport.hari_terlambat} Hari` : "Tepat Waktu"}
                </span>
                {data.returnReport.denda_terlambat > 0 && (
                  <span className="text-[9px] font-bold text-[#991B1B] block">
                    Denda: {formatRupiah(data.returnReport.denda_terlambat)}
                  </span>
                )}
              </div>

              <div className="p-2 rounded bg-white border border-[#E8E8E1]">
                <span className="text-[#5F7A84] block text-[9px] font-bold uppercase">Kondisi Fisik Unit</span>
                <span className="font-extrabold text-[#234E5C] block">
                  {data.returnReport.total_ganti_rugi > 0 ? "Ada Kerusakan/Hilang" : "Lengkap & Prima"}
                </span>
                {data.returnReport.total_ganti_rugi > 0 && (
                  <span className="text-[9px] font-bold text-[#991B1B] block">
                    Ganti Rugi: {formatRupiah(data.returnReport.total_ganti_rugi)}
                  </span>
                )}
              </div>

              <div className="p-2 rounded bg-white border border-[#E8E8E1]">
                <span className="text-[#5F7A84] block text-[9px] font-bold uppercase">Deposit Dikembalikan</span>
                <span className="font-extrabold text-[#2E5E4E] block">
                  {formatRupiah(data.returnReport.deposit_dikembalikan)}
                </span>
                <span className="text-[9px] text-[#5F7A84] block">Lunas Diselesaikan</span>
              </div>
            </div>

            {data.returnReport.damage_reports && data.returnReport.damage_reports.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-[#991B1B] block uppercase">
                  Rincian Kerusakan & Ganti Rugi:
                </span>
                {data.returnReport.damage_reports.map((dm) => (
                  <div
                    key={dm.id}
                    className="p-2 rounded bg-white border border-[#FECACA] flex justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-[#234E5C] uppercase mr-2 text-[10px]">
                        [{dm.jenis.replace("_", " ")}]
                      </span>
                      <span>
                        {dm.deskripsi} ({dm.jumlah} unit)
                      </span>
                    </div>
                    <span className="font-bold text-[#991B1B]">{formatRupiah(dm.biaya_ganti_rugi)}</span>
                  </div>
                ))}
              </div>
            )}

            {data.returnReport.catatan && (
              <p className="text-[10px] text-[#5F7A84] italic pt-1 border-t border-[#234E5C]/10">
                Catatan Petugas: &quot;{data.returnReport.catatan}&quot;
              </p>
            )}
          </div>
        )}

        {/* Footer Cetak & Konfirmasi Elektronik */}
        <div className="text-center pt-6 border-t border-[#E8E8E1] text-[10px] text-[#5F7A84] space-y-1">
          <p className="font-semibold text-[#234E5C]">
            Dokumen ini merupakan bukti transaksi dan surat perjanjian booking/sewa resmi yang diterbitkan secara elektronik oleh {APP_NAME}.
          </p>
          <p className="text-[9px] text-[#5F7A84]">
            Sah dan mengikat tanpa memerlukan tanda tangan basah fisik dari kedua belah pihak.
          </p>
        </div>
      </div>
    </div>
  );
}
