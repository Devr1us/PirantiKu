import type { Metadata } from "next";
import Link from "next/link";
import { H1, H2, Lead } from "@/components/ui/typography";
import { HelpCircle, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, ADMIN_WHATSAPP_NUMBER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tanya Jawab (FAQ)",
  description: `Pertanyaan yang sering diajukan seputar layanan sewa alat di ${APP_NAME}.`,
  openGraph: {
    title: `Tanya Jawab (FAQ) | ${APP_NAME}`,
    description: `Pertanyaan yang sering diajukan seputar layanan sewa alat di ${APP_NAME}.`,
    url: "/faq",
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
      a: "Uang muka pemesanan adalah 30% dari total nilai sewa. Pembayaran DP ini menjamin unit alat terkunci untuk Anda pada jadwal yang dipilih dan tidak akan diberikan ke pelanggan lain.",
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
      a: "Saat ini seluruh serah terima dan pengembalian alat berfokus dilakukan langsung di toko/workshop kami. Hal ini bertujuan agar penyewa dan staf dapat bersama-sama melakukan uji coba fungsi serta inspeksi fisik unit sebelum digunakan.",
    },
    {
      q: "Apa saja syarat dokumen saat pengambilan alat?",
      a: "Penyewa wajib membawa kartu identitas asli (KTP atau SIM) yang masih berlaku dengan nama yang sama dengan nama pada akun booking, serta menyelesaikan pelunasan sisa biaya dan deposit jaminan.",
    },
    {
      q: "Bagaimana jika saya terlambat mengembalikan alat?",
      a: "Pengembalian alat maksimal pukul 21.00 WIB pada tanggal selesai booking. Keterlambatan tanpa koordinasi awal akan dikenakan denda sesuai tarif harian alat yang dapat dipotong langsung dari deposit jaminan.",
    },
    {
      q: "Bagaimana jika alat rusak selama pemakaian?",
      a: "Jika terjadi kerusakan akibat pemakaian wajar atau kendala teknis unit, segera hubungi admin kami untuk panduan penanganan atau penggantian unit. Jika kerusakan terjadi akibat kelalaian operasional, biaya perbaikan resmi akan dipotong dari deposit.",
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
          <Button variant="warm" size="sm" className="text-xs font-bold gap-2 shrink-0">
            <MessageCircle className="h-4 w-4" />
            Hubungi Admin WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
