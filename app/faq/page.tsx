import type { Metadata } from "next";
import Link from "next/link";
import { H1, Lead } from "@/components/ui/typography";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, ADMIN_WHATSAPP_NUMBER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tanya Jawab (FAQ)",
  description: `Pertanyaan yang sering diajukan seputar layanan booking alat di ${APP_NAME}.`,
  openGraph: {
    title: `Tanya Jawab (FAQ) | ${APP_NAME}`,
    description: `Pertanyaan yang sering diajukan seputar layanan booking alat di ${APP_NAME}.`,
    url: "/faq",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: `${APP_NAME} FAQ`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Tanya Jawab (FAQ) | ${APP_NAME}`,
    description: `Pertanyaan yang sering diajukan seputar layanan booking alat di ${APP_NAME}.`,
    images: ["/logo.png"],
  },
};

export default function FAQPage() {
  const faqs = [
    {
      q: "Bagaimana cara booking alat di PirantiKu?",
      a: "Pilih alat yang Anda inginkan dari katalog, tentukan tanggal mulai dan selesai peminjaman, masukkan ke keranjang, lalu lakukan checkout. Kunci stok dengan membayar DP 30% dan upload bukti transfer Anda.",
    },
    {
      q: "Berapa minimal uang muka (DP) yang harus dibayar?",
      a: "Uang muka pemesanan adalah 30% dari total nilai booking. Pembayaran DP ini menjamin unit alat terkunci untuk Anda pada jadwal yang dipilih dan tidak akan diberikan ke pelanggan lain.",
    },
    {
      q: "Berapa lama batas waktu pembayaran DP setelah booking?",
      a: "Batas waktu pembayaran uang muka (DP) adalah maksimal 24 jam sejak pesanan dibuat. Jika pembayaran DP belum diselesaikan dalam 24 jam, sistem akan otomatis membatalkan pesanan agar stok alat dapat diakses oleh user lain.",
    },
    {
      q: "Bagaimana ketentuan pembatalan booking dan pengembalian uang muka (refund)?",
      a: "Pembatalan yang diajukan lebih dari 24 jam sebelum tanggal mulai booking berhak atas pengembalian (refund) DP 100% penuh atau dialihkan jadwalnya. Namun, pembatalan yang diajukan dalam kurun waktu 24 jam atau kurang sebelum tanggal mulai booking membuat DP hangus (non-refundable) karena unit telah disiapkan dan menolak calon user lain.",
    },
    {
      q: "Metode pembayaran apa saja yang didukung?",
      a: "Kami menerima pembayaran DP dan pelunasan melalui Transfer Rekening Bank (BCA) serta pembayaran instan QRIS yang dapat di-scan dari seluruh aplikasi mobile banking atau e-Wallet (GoPay, OVO, Dana, ShopeePay).",
    },
    {
      q: "Kapan deposit jaminan dikembalikan?",
      a: "Deposit jaminan dikembalikan utuh 100% pada hari pengembalian saat alat tiba di toko dan diverifikasi kelengkapannya serta fungsi alat dalam keadaan prima.",
    },
    {
      q: "Apakah ada layanan antar-jemput alat?",
      a: "Saat ini seluruh serah terima dan pengembalian alat berfokus dilakukan langsung di toko/workshop kami. Hal ini bertujuan agar user dan staf dapat bersama-sama melakukan uji coba fungsi serta inspeksi fisik unit sebelum digunakan.",
    },
    {
      q: "Apa saja syarat dokumen saat pengambilan alat?",
      a: "User wajib membawa dan menunjukkan kartu identitas resmi yang masih aktif (KTP atau SIM asli) yang sesuai dengan nama pada akun booking untuk verifikasi fisik saat serah terima, serta menyelesaikan pelunasan sisa biaya booking dan deposit jaminan.",
    },
    {
      q: "Bagaimana jika saya terlambat mengembalikan alat?",
      a: "Pengembalian alat maksimal pukul 21.00 WIB pada tanggal selesai booking (sesuai jam operasional toko 08.00 - 21.00 WIB). Keterlambatan tanpa koordinasi awal dikenakan denda sebesar 1x tarif booking harian alat untuk setiap 1 hari keterlambatan yang dipotong langsung dari deposit jaminan.",
    },
    {
      q: "Bagaimana jika alat rusak selama pemakaian?",
      a: "Jika terjadi kerusakan akibat pemakaian wajar atau kendala teknis unit, segera hubungi admin kami untuk panduan penanganan atau penggantian unit. Jika kerusakan terjadi akibat kelalaian operasional, biaya perbaikan resmi akan dipotong dari deposit.",
    },
    {
      q: "Apakah pengambilan alat bisa diwakilkan orang lain?",
      a: "Bisa, dengan syarat penerima kuasa membawa Surat Kuasa tertulis yang ditandatangani oleh pemesan, serta menunjukkan identitas asli pemesan dan identitas asli penerima kuasa saat serah terima di toko.",
    },
    {
      q: "Berapa batas usia minimal untuk menyewa alat?",
      a: "User wajib berusia minimal 17 tahun dan memiliki kartu identitas resmi yang sah (KTP atau SIM asli) yang masih aktif untuk ditunjukkan dalam proses verifikasi serah terima unit. Khusus untuk peralatan pertukangan bermesin besar yang memiliki risiko tinggi (seperti mesin las, bor beton, gerinda tangan, dan gergaji circular), user pemula disarankan didampingi teknisi atau orang dewasa berpengalaman demi keselamatan kerja.",
    },
    {
      q: "Bisakah saya memperpanjang masa booking (extend)?",
      a: "Bisa. Anda wajib mengonfirmasi ke Admin WhatsApp kami minimal 24 jam sebelum masa booking berakhir. Perpanjangan dapat disetujui jika unit belum dipesan oleh user lain pada jadwal berikutnya.",
    },
    {
      q: "Bagaimana jika stok alat yang saya butuhkan sedang habis?",
      a: "Silakan hubungi Admin melalui WhatsApp. Tim kami dapat mengecek jadwal pengembalian unit terdekat atau memberikan rekomendasi tipe alat alternatif yang memiliki fungsi serupa.",
    },
  ];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8 space-y-10 text-[#234E5C]">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 text-xs font-bold gap-1 pl-0 text-[#5F7A84] hover:text-[#234E5C]">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </Link>
        <H1 className="section-title">PERTANYAAN UMUM (FAQ)</H1>
        <Lead className="text-sm text-[#5F7A84] mt-2">
          Jawaban lengkap atas pertanyaan yang sering diajukan pelanggan seputar layanan {APP_NAME}.
        </Lead>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E8E8E1] rounded-2xl p-6 shadow-xs space-y-2 transition-all hover:border-[#234E5C]/40"
          >
            <h3 className="text-base font-bold text-[#234E5C] flex items-start gap-2.5">
              <span className="text-[#A0630F] font-extrabold">{idx + 1}.</span>
              {faq.q}
            </h3>
            <p className="text-sm text-[#5F7A84] pl-6 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-[#F3F3EF] border border-[#E8E8E1] rounded-2xl gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#234E5C]">Pertanyaan Anda belum terjawab?</h4>
          <p className="text-xs text-[#5F7A84] mt-0.5">
            Tim admin kami siap membantu konsultasi alat dan ketersediaan unit melalui WhatsApp.
          </p>
        </div>
        <a
          href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="warm" size="sm" className="text-xs font-bold shrink-0">
            Hubungi Admin WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
