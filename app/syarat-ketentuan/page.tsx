import type { Metadata } from "next";
import Link from "next/link";
import { H1, H2, Lead } from "@/components/ui/typography";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Ketentuan dan syarat lengkap rental booking perlengkapan di ${APP_NAME}.`,
  openGraph: {
    title: `Syarat & Ketentuan | ${APP_NAME}`,
    description: `Ketentuan dan syarat lengkap rental booking perlengkapan di ${APP_NAME}.`,
    url: "/syarat-ketentuan",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: `${APP_NAME} Syarat & Ketentuan`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Syarat & Ketentuan | ${APP_NAME}`,
    description: `Ketentuan dan syarat lengkap rental booking perlengkapan di ${APP_NAME}.`,
    images: ["/logo.png"],
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
            <li>Penyewa berusia minimal 13 tahun dan <strong>wajib membawa kartu identitas asli</strong> (Kartu Pelajar, KIA, KTP, atau SIM) yang masih aktif sebagai jaminan verifikasi fisik serah terima unit.</li>
            <li>Pelunasan sisa biaya sewa serta <strong>deposit jaminan</strong> dibayarkan saat pengambilan unit.</li>
            <li>Penyewa dan petugas kami akan melakukan pemeriksaan fisik dan uji fungsi alat bersama sebelum unit dibawa.</li>
          </ul>
        </section>

        {/* Pasal 3 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">3. Deposit Jaminan & Ketentuannya</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Deposit jaminan merupakan dana titipan sementara untuk menjamin keamanan unit alat selama masa rental.</li>
            <li><strong>Besaran Nominal Deposit:</strong> Besaran deposit jaminan bervariasi bergantung pada kategori, nilai aset, dan tingkat kerentanan masing-masing alat. Nilai deposit setiap alat tertera secara transparan di halaman detail alat dan keranjang booking sebelum Anda checkout.</li>
            <li>Deposit jaminan akan <strong>dikembalikan utuh 100%</strong> secara tunai atau transfer instan pada saat alat dikembalikan tepat waktu, bersih, dan seluruh fungsi beroperasi normal.</li>
          </ul>
        </section>

        {/* Pasal 4 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">4. Keterlambatan Pengembalian (Denda)</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Unit wajib dikembalikan selambat-lambatnya pada tanggal selesai sewa pukul 21.00 WIB (sesuai jam operasional toko 08.00 - 21.00 WIB).</li>
            <li><strong>Rumus Denda:</strong> Keterlambatan pengembalian tanpa konfirmasi awal dikenakan denda sebesar <strong>1x tarif sewa harian alat per hari keterlambatan</strong> (Rumus: <em>Tarif Sewa Harian &times; Jumlah Hari Terlambat</em>).</li>
            <li>Total denda keterlambatan dipotong langsung dari deposit jaminan penyewa saat serah terima pengembalian.</li>
          </ul>
        </section>

        {/* Pasal 5 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">5. Kerusakan & Kehilangan Alat</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Penyewa bertanggung jawab penuh atas keutuhan dan keselamatan alat selama masa pinjam.</li>
            <li>Kerusakan akibat kelalaian operasional akan dikenakan biaya perbaikan/servis resmi yang dipotong dari deposit jaminan. Jika biaya reparasi melebihi nilai deposit, penyewa wajib melunasi kekurangannya.</li>
            <li>Kehilangan unit atau kelengkapan aksesoris wajib diganti oleh penyewa dengan unit barang yang tipe, merk, dan spesifikasinya sama atau senilai harga unit baru.</li>
          </ul>
        </section>

        {/* Pasal 6 */}
        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">6. Kebijakan Pembatalan & Pengembalian Dana (Refund)</H2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li><strong>Tata Cara Pengajuan Pembatalan:</strong> Pengajuan pembatalan atau perubahan jadwal booking dapat dilakukan secara mandiri dengan menekan tombol <em>Batalkan Pesanan</em> pada halaman <strong>Booking Saya</strong> atau dengan menghubungi Admin kami via WhatsApp resmi (0857-0151-6287).</li>
            <li><strong>Pembatalan oleh Penyewa &gt; 24 Jam:</strong> Pembatalan yang diajukan lebih dari 24 jam sebelum tanggal mulai booking berhak mendapatkan <strong>pengembalian uang muka (DP) 100% penuh</strong> atau dialihkan menjadi kredit jadwal booking baru tanpa biaya tambahan.</li>
            <li><strong>Pembatalan oleh Penyewa &le; 24 Jam:</strong> Pembatalan sepihak dalam waktu kurang dari 24 jam sebelum tanggal sewa menyebabkan DP hangus (tidak dapat direfund) karena unit telah disiapkan dan menolak calon penyewa lain.</li>
            <li><strong>Pembatalan oleh Pihak PirantiKu:</strong> Apabila alat mengalami kerusakan mendadak saat inspeksi pra-serah terima dan tidak tersedia unit pengganti yang setara, PirantiKu akan mengembalikan <strong>100% seluruh pembayaran DP seketika</strong> dan memberikan kompensasi prioritas pada jadwal berikutnya.</li>
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
