import type { Metadata } from "next";
import Link from "next/link";
import { H1, H2, Lead } from "@/components/ui/typography";
import { ShieldCheck, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Ketentuan dan syarat lengkap rental booking perlengkapan di ${APP_NAME}.`,
  openGraph: {
    title: `Syarat & Ketentuan | ${APP_NAME}`,
    description: `Ketentuan dan syarat lengkap rental booking perlengkapan di ${APP_NAME}.`,
    url: "/syarat-ketentuan",
  },
};

export default function SyaratKetentuanPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8 space-y-10 text-[#234E5C]">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 text-xs font-bold gap-1 pl-0 text-[#5F7A84] hover:text-[#234E5C]">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </Link>
        <H1 className="section-title">SYARAT & KETENTUAN RENTAL</H1>
        <Lead className="text-sm text-[#5F7A84] mt-2">
          Panduan resmi dan ketentuan penggunaan layanan booking perlengkapan di {APP_NAME}.
        </Lead>
      </div>

      <div className="space-y-8 bg-white border border-[#E8E8E1] rounded-2xl p-6 sm:p-10 shadow-xs leading-relaxed text-sm">
        {/* Pasal 1 */}
        <section className="space-y-3">
          <H2 className="text-lg font-bold text-[#234E5C]">1. Pemesanan & Pembayaran Uang Muka (DP)</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Pemesanan dilakukan secara mandiri melalui website {APP_NAME} dengan memilih jadwal tanggal sewa.</li>
            <li>Untuk mengunci ketersediaan unit, penyewa wajib membayar Uang Muka (DP) sebesar 30% dari total biaya sewa melalui transfer bank atau QRIS yang tersedia.</li>
            <li>Pesanan yang belum dibayarkan DP-nya dalam batas waktu 24 jam akan otomatis dibatalkan oleh sistem agar stok dapat diakses oleh penyewa lain.</li>
          </ul>
        </section>

        {/* Pasal 2 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">2. Pengambilan Unit & Identitas Penyewa</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Pengambilan alat dilakukan langsung di workshop/toko kami sesuai jam operasional (08.00 - 21.00 WIB).</li>
            <li>Penyewa <strong>wajib membawa kartu identitas asli</strong> (KTP atau SIM) yang masih berlaku dengan nama sesuai akun booking untuk proses verifikasi serah terima.</li>
            <li>Pelunasan sisa biaya sewa serta <strong>deposit jaminan</strong> dibayarkan saat pengambilan unit.</li>
            <li>Penyewa dan petugas kami akan melakukan pemeriksaan fisik dan uji fungsi alat bersama sebelum unit dibawa.</li>
          </ul>
        </section>

        {/* Pasal 3 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">3. Deposit Jaminan & Pengembaliannya</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Deposit jaminan merupakan dana titipan sementara untuk menjamin keamanan unit alat selama masa rental.</li>
            <li>Deposit jaminan akan <strong>dikembalikan utuh 100%</strong> secara tunai atau transfer saat alat dikembalikan tepat waktu, bersih, dan berfungsi dengan baik.</li>
          </ul>
        </section>

        {/* Pasal 4 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">4. Keterlambatan Pengembalian (Denda)</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Unit wajib dikembalikan selambat-lambatnya pada tanggal selesai sewa pukul 21.00 WIB.</li>
            <li>Keterlambatan pengembalian tanpa konfirmasi sebelumnya akan dikenakan denda keterlambatan sebesar biaya sewa harian alat ditambah biaya kompensasi operasional per hari keterlambatan.</li>
            <li>Denda keterlambatan dapat dipotong langsung dari deposit jaminan penyewa.</li>
          </ul>
        </section>

        {/* Pasal 5 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">5. Kerusakan & Kehilangan Alat</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Penyewa bertanggung jawab penuh atas keutuhan dan keselamatan alat selama masa pinjam.</li>
            <li>Kerusakan akibat kelalaian atau kesalahan operasional akan dikenakan biaya perbaikan/servis resmi yang dipotong dari deposit jaminan. Jika biaya reparasi melebihi nilai deposit, penyewa wajib melunasi kekurangannya.</li>
            <li>Kehilangan unit atau kelengkapan aksesoris wajib diganti oleh penyewa dengan unit barang yang tipe, merk, dan spesifikasinya sama atau senilai harga unit baru.</li>
          </ul>
        </section>

        {/* Pasal 6 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">6. Kebijakan Pembatalan & Jadwal Ulang</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Pembatalan sepihak oleh penyewa yang dilakukan kurang dari 24 jam sebelum tanggal mulai booking menyebabkan DP tidak dapat di-refund karena unit telah diblokir dari pelanggan lain.</li>
            <li>Penyewa dapat mengajukan perubahan jadwal (reschedule) maksimal 1 kali dengan menghubungi Admin via WhatsApp paling lambat 1 hari sebelum jadwal sewa, selama unit pengganti masih tersedia.</li>
          </ul>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-[#F3F3EF] border border-[#E8E8E1] rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-[#2E5E4E] shrink-0" />
          <p className="text-xs text-[#234E5C] font-semibold">
            Ada pertanyaan lebih lanjut seputar aturan booking? Hubungi admin kami kapan saja.
          </p>
        </div>
        <Link href="/faq">
          <Button variant="warm" size="sm" className="text-xs font-bold shrink-0">
            Buka Halaman FAQ
          </Button>
        </Link>
      </div>
    </div>
  );
}
