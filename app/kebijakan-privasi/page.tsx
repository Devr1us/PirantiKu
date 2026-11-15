import type { Metadata } from "next";
import Link from "next/link";
import { H1, H2, Lead } from "@/components/ui/typography";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: `Kebijakan privasi dan perlindungan data pengguna layanan ${APP_NAME}.`,
  openGraph: {
    title: `Kebijakan Privasi | ${APP_NAME}`,
    description: `Kebijakan privasi dan perlindungan data pengguna layanan ${APP_NAME}.`,
    url: "/kebijakan-privasi",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: `${APP_NAME} Kebijakan Privasi`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Kebijakan Privasi | ${APP_NAME}`,
    description: `Kebijakan privasi dan perlindungan data pengguna layanan ${APP_NAME}.`,
    images: ["/logo.png"],
  },
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8 space-y-10 text-[#234E5C]">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 text-xs font-bold gap-1 pl-0 text-[#5F7A84] hover:text-[#234E5C]">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </Link>
        <H1 className="section-title">KEBIJAKAN PRIVASI</H1>
        <Lead className="text-sm text-[#5F7A84] mt-2">
          Komitmen {APP_NAME} dalam menjaga kerahasiaan dan keamanan informasi pribadi Anda.
        </Lead>
      </div>

      <div className="space-y-8 bg-white border border-[#E8E8E1] rounded-2xl p-6 sm:p-10 shadow-xs leading-relaxed text-sm">
        <section className="space-y-3">
          <H2 className="text-lg font-bold text-[#234E5C]">1. Informasi yang Kami Kumpulkan</H2>
          <p className="text-[#5F7A84]">
            Untuk menyediakan layanan rental yang aman dan akurat, kami mengumpulkan data yang Anda berikan secara langsung saat mendaftar atau memesan:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5F7A84]">
            <li><strong>Data Akun:</strong> Nama lengkap, alamat email terdaftar, dan nomor WhatsApp / handphone.</li>
            <li><strong>Data Transaksi:</strong> Riwayat booking alat, durasi peminjaman, dan bukti pembayaran (transfer bank atau QRIS).</li>
            <li><strong>Identitas Fisik (Verifikasi Toko):</strong> Kartu identitas asli (KTP atau SIM) yang diperiksa saat serah terima alat di toko untuk verifikasi keamanan unit.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">2. Penggunaan Informasi Pribadi</H2>
          <p className="text-[#5F7A84]">Data Anda hanya dimanfaatkan untuk tujuan berikut:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5F7A84]">
            <li>Memproses reservasi, mengunci ketersediaan stok, dan menerbitkan invoice pembayaran.</li>
            <li>Mengirimkan notifikasi dan konfirmasi pemesanan ke nomor WhatsApp yang Anda daftarkan.</li>
            <li>Mencegah penipuan, kehilangan aset rental, serta keperluan verifikasi serah terima unit secara sah.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">3. Pembagian Data & Keamanan</H2>
          <p className="text-[#5F7A84]">
            {APP_NAME} berkomitmen tidak pernah memperjualbelikan data pribadi Anda kepada pihak mana pun. Kami hanya membagikan data kepada penyedia infrastruktur tepercaya yang esensial untuk jalannya operasional layanan (seperti penyedia layanan autentikasi cloud, gateway pengiriman notifikasi WhatsApp, dan penyedia peta digital).
          </p>
          <p className="text-[#5F7A84]">
            Seluruh data yang disimpan dilindungi dengan enkripsi standar industri (SSL/TLS) dan pembatasan hak akses berbasis otentikasi ketat demi mencegah akses tidak sah.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">4. Masa Retensi (Penyimpanan Data)</H2>
          <p className="text-[#5F7A84]">
            Data akun Anda disimpan selama akun masih aktif terdaftar pada layanan kami. Data riwayat transaksi sewa disimpan selama maksimal 2 (dua) tahun sejak transaksi selesai guna keperluan pencatatan keuangan, verifikasi garansi deposit, dan audit internal, setelah itu data transaksi akan diarsipkan atau dihapus permanen.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">5. Kepatuhan Hukum & Hak Pengguna</H2>
          <p className="text-[#5F7A84]">
            Kebijakan privasi ini disusun sesuai dengan ketentuan <strong>Undang-Undang Pelindungan Data Pribadi (UU No. 27 Tahun 2022)</strong> Republik Indonesia. Anda memiliki hak untuk mengakses, memperbarui nama dan kontak melalui halaman <em>Profil Akun</em>, serta berhak meminta penghapusan akun beserta data pribadi terkait dengan menghubungi Admin kami.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">6. Kontak Pengelola Data</H2>
          <p className="text-[#5F7A84]">
            Apabila Anda memiliki pertanyaan, permohonan hak data, atau keluhan seputar pemrosesan data pribadi, silakan hubungi tim kami melalui email <strong>halo@pirantiku.web.id</strong> atau WhatsApp Admin Resmi di <strong>0857-0151-6287</strong>.
          </p>
        </section>
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#F3F3EF] border border-[#E8E8E1] rounded-2xl text-xs text-[#5F7A84]">
        <Lock className="h-5 w-5 text-[#234E5C] shrink-0" />
        <span>Keamanan dan privasi data pelanggan adalah prioritas utama operasional {APP_NAME}.</span>
      </div>
    </div>
  );
}
