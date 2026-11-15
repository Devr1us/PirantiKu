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
          <H2 className="text-lg font-bold text-[#234E5C]">3. Keamanan Data & Kerahasiaan</H2>
          <p className="text-[#5F7A84]">
            {APP_NAME} menerapkan protokol keamanan berstandar industri dengan enkripsi data (SSL/TLS dan Row Level Security database Supabase). Kami <strong>tidak pernah menjual, meminjamkan, atau membagikan</strong> informasi pribadi Anda kepada pihak ketiga mana pun tanpa persetujuan Anda, kecuali jika diwajibkan oleh proses penegakan hukum yang sah di Republik Indonesia.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">4. Hak Pengguna atas Data</H2>
          <p className="text-[#5F7A84]">
            Anda berhak melihat, memperbarui nomor kontak, atau meminta penghapusan akun serta riwayat data pribadi Anda melalui menu profil akun atau dengan menghubungi Admin resmi kami.
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
