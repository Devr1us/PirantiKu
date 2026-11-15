import type { Metadata } from "next";
import Link from "next/link";
import { H1, H2, Lead } from "@/components/ui/typography";
import { Lock, ArrowLeft } from "lucide-react";
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
        <p className="text-xs text-[#5F7A84]/80 mt-1 italic">
          Terakhir diperbarui: 15 November 2026
        </p>
      </div>

      <div className="space-y-8 bg-white border border-[#E8E8E1] rounded-2xl p-6 sm:p-10 shadow-xs leading-relaxed text-sm">
        <section className="space-y-3">
          <H2 className="text-lg font-bold text-[#234E5C]">1. Informasi Pengendali & Pengelola Data</H2>
          <p className="text-[#5F7A84]">
            Pengendali data pribadi atas layanan ini adalah <strong>Manajemen {APP_NAME}</strong>, penyedia jasa rental perlengkapan terintegrasi yang beroperasi di wilayah Karanganyar, Jawa Tengah. Kami tunduk sepenuhnya pada peraturan perundang-undangan Republik Indonesia, khususnya <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">2. Informasi yang Kami Kumpulkan</H2>
          <p className="text-[#5F7A84]">
            Untuk menyediakan layanan rental yang aman, akurat, dan terverifikasi, kami mengumpulkan data yang Anda berikan melalui situs:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li><strong>Data Akun:</strong> Nama lengkap dan alamat email yang didaftarkan saat registrasi awal.</li>
            <li><strong>Nomor Kontak / WhatsApp:</strong> Dikumpulkan saat Anda melengkapi data diri di <Link href="/profil" className="font-semibold underline hover:text-[#234E5C]">Profil Akun</Link> atau saat mengisi formulir checkout pesanan untuk koordinasi sewa dan pengingat reservasi.</li>
            <li><strong>Data Autentikasi Pihak Ketiga (Google OAuth):</strong> Jika Anda memilih masuk menggunakan akun Google, kami menerima identitas dasar berupa nama, email terverifikasi, dan foto profil Anda dari Google secara terenkripsi untuk mempermudah akses login.</li>
            <li><strong>Data Transaksi:</strong> Riwayat booking alat, durasi peminjaman, rincian biaya sewa & deposit, serta bukti transfer pembayaran uang muka (DP).</li>
            <li><strong>Identitas Fisik (Verifikasi Toko):</strong> Kartu identitas fisik resmi asli (KTP atau SIM) wajib ditunjukkan untuk proses verifikasi langsung saat serah terima alat di toko demi keamanan aset rental.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">3. Penggunaan Informasi Pribadi</H2>
          <p className="text-[#5F7A84]">Data Anda dimanfaatkan semata-mata untuk kebutuhan operasional layanan:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#5F7A84]">
            <li>Memproses reservasi, memvalidasi ketersediaan stok, dan menerbitkan rincian booking.</li>
            <li>Mengirimkan konfirmasi pesanan, pengingat jadwal sewa, dan informasi pengembalian melalui WhatsApp dan email.</li>
            <li>Verifikasi kepemilikan sewa serta pencegahan penipuan atau kehilangan aset rental.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">4. Cookie & Penyimpanan Sesi Teknis</H2>
          <p className="text-[#5F7A84]">
            {APP_NAME} hanya menggunakan penyimpanan teknis esensial (first-party session cookies & browser local storage) untuk menjaga status login Anda dan menyimpan keranjang belanja sementara. Kami <strong>tidak</strong> menanamkan cookie pelacak pihak ketiga untuk keperluan periklanan bertarget.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">5. Pembagian Data & Keamanan</H2>
          <p className="text-[#5F7A84]">
            {APP_NAME} berkomitmen tidak pernah memperjualbelikan data pribadi Anda kepada pihak mana pun. Kami hanya bekerja sama dengan penyedia infrastruktur cloud tepercaya (seperti Supabase untuk database & autentikasi terenkripsi SSL/TLS, dan Resend untuk pengiriman kode verifikasi transaksi).
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">6. Masa Retensi Data</H2>
          <p className="text-[#5F7A84]">
            Data akun Anda disimpan selama akun masih aktif digunakan. Data riwayat transaksi sewa disimpan selama maksimal 2 (dua) tahun guna pencatatan keuangan, verifikasi garansi deposit, dan audit internal, setelah itu data transaksi akan diarsipkan atau dihapus secara permanen.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">7. Hak Pengguna & Penghapusan Data</H2>
          <p className="text-[#5F7A84]">
            Sesuai UU PDP, Anda berhak memeriksa, memperbarui data diri melalui menu profil, atau mengajukan permohonan penutupan akun dan penghapusan data dengan menghubungi Admin Resmi kami.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#E8E8E1] pt-6">
          <H2 className="text-lg font-bold text-[#234E5C]">8. Kontak Resmi Pengelola Data</H2>
          <p className="text-[#5F7A84]">
            Apabila Anda memiliki pertanyaan atau permohonan terkait data pribadi, silakan hubungi tim pengelola data kami:
          </p>
          <div className="p-4 rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] text-xs space-y-1">
            <p><strong>Pengelola:</strong> Manajemen {APP_NAME}</p>
            <p><strong>Alamat Operasional:</strong> Karanganyar, Jawa Tengah, Indonesia</p>
            <p><strong>WhatsApp Admin Resmi:</strong> 0857-0151-6287</p>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#F3F3EF] border border-[#E8E8E1] rounded-2xl text-xs text-[#5F7A84]">
        <Lock className="h-5 w-5 text-[#234E5C] shrink-0" />
        <span>Keamanan dan privasi data pelanggan adalah prioritas utama operasional {APP_NAME}.</span>
      </div>
    </div>
  );
}
