import Link from "next/link";
import {
  Calendar,
  CreditCard,
  Package,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Clock,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { H1, H2, Lead, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { DEFAULT_SETTINGS, normalizeAdminPhone } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CaraBookingPage() {
  const supabase = await createClient();

  let dpPersen = 30;
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;
  let jamOperasional = DEFAULT_SETTINGS.jam_operasional;

  const { data: settings } = await supabase.from("settings").select("key, value");
  if (settings) {
    settings.forEach((s) => {
      if (s.key === "dp_persen" && s.value) dpPersen = Number(s.value) || 30;
      if (s.key === "whatsapp_admin" && s.value) whatsappAdmin = normalizeAdminPhone(s.value);
      if (s.key === "jam_operasional" && s.value) jamOperasional = s.value;
    });
  }

  const cleanWa = normalizeAdminPhone(whatsappAdmin);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 space-y-12 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman & Breadcrumbs */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#5F7A84]">
          <Link href="/" className="hover:text-[#234E5C] font-semibold">
            Beranda
          </Link>
          <span>/</span>
          <span className="font-bold text-[#234E5C]">Cara Booking</span>
        </div>
        <H1 className="section-title block pt-1">CARA BOOKING PERALATAN</H1>
        <Lead className="text-base text-[#5F7A84] font-medium max-w-2xl">
          Tiga langkah praktis untuk booking perlengkapan camping, pertukangan, event, dan kebersihan secara online.
        </Lead>
      </div>

      {/* 3 Langkah Utama Bernomor Besar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Langkah 01 */}
        <div className="rounded-2xl border border-[#E8E8E1] bg-white p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#234E5C] leading-none block">
              01
            </span>
            <h3 className="text-lg font-bold text-[#234E5C] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#234E5C]" />
              Pilih Alat &amp; Jadwal Sewa
            </h3>
            <p className="text-sm text-[#5F7A84] leading-relaxed">
              Jelajahi katalog dan pilih perlengkapan yang Anda perlukan. Tentukan tanggal mulai dan selesai peminjaman untuk melihat sisa stok yang tersedia secara real-time.
            </p>
          </div>
          <div className="pt-4 border-t border-[#E8E8E1] text-xs text-[#5F7A84] space-y-1">
            <span className="font-bold text-[#234E5C] block">Tips:</span>
            <p>Durasi sewa 7 hari ke atas otomatis mendapatkan tarif sewa mingguan yang lebih hemat.</p>
          </div>
        </div>

        {/* Langkah 02 */}
        <div className="rounded-2xl border border-[#E8E8E1] bg-white p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#A0630F] leading-none block">
              02
            </span>
            <h3 className="text-lg font-bold text-[#234E5C] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#A0630F]" />
              Booking &amp; Bayar DP {dpPersen}%
            </h3>
            <p className="text-sm text-[#5F7A84] leading-relaxed">
              Kunci unit pesanan Anda dengan membayar uang muka (DP) {dpPersen}% via transfer BCA atau scan QRIS &amp; e-Wallet. Kirim foto bukti transfer untuk verifikasi admin yang cepat.
            </p>
          </div>
          <div className="pt-4 border-t border-[#E8E8E1] text-xs text-[#5F7A84] space-y-1">
            <span className="font-bold text-[#234E5C] block">Verifikasi Kilat:</span>
            <p>Admin akan memverifikasi mutasi DP dalam 15-30 menit setelah bukti struk diunggah.</p>
          </div>
        </div>

        {/* Langkah 03 */}
        <div className="rounded-2xl border border-[#E8E8E1] bg-white p-8 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#2E5E4E] leading-none block">
              03
            </span>
            <h3 className="text-lg font-bold text-[#234E5C] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2E5E4E]" />
              Ambil, Pakai &amp; Kembalikan
            </h3>
            <p className="text-sm text-[#5F7A84] leading-relaxed">
              Pengambilan alat langsung di toko kami dengan membawa kartu identitas fisik asli (KTP/SIM). Selesaikan sisa sewa &amp; deposit, pakai alat, dan kembalikan tepat waktu untuk pencairan utuh deposit.
            </p>
          </div>
          <div className="pt-4 border-t border-[#E8E8E1] text-xs text-[#5F7A84] space-y-1">
            <span className="font-bold text-[#234E5C] block">Jaminan 100%:</span>
            <p>Deposit jaminan dikembalikan penuh tanpa potongan tersembunyi saat alat kembali normal.</p>
          </div>
        </div>
      </div>

      {/* Syarat Penting Pengambilan Unit */}
      <div className="rounded-2xl border border-[#E8E8E1] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-[#234E5C] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#234E5C]" />
            Ketentuan Penting Sewa &amp; Serah Terima
          </h2>
          <p className="text-xs sm:text-sm text-[#5F7A84]">
            Harap perhatikan ketentuan berikut demi kenyamanan dan keamanan transaksi Anda:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-2">
            <span className="font-bold text-[#234E5C] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2E5E4E]" />
              Identitas Fisik Asli
            </span>
            <p className="text-[#5F7A84] leading-relaxed">
              Penyewa wajib membawa fisik asli KTP atau SIM yang masih berlaku dan atas nama yang sama dengan data akun saat serah terima unit di lokasi.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-2">
            <span className="font-bold text-[#234E5C] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2E5E4E]" />
              Deposit Jaminan (Kembali 100%)
            </span>
            <p className="text-[#5F7A84] leading-relaxed">
              Deposit jaminan dibayarkan saat serah terima alat dan akan dikembalikan utuh tanpa potongan setelah alat diperiksa saat pengembalian.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-2">
            <span className="font-bold text-[#234E5C] flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#234E5C]" />
              Jam Operasional &amp; Batas Kembali
            </span>
            <p className="text-[#5F7A84] leading-relaxed">
              Pengambilan dan pengembalian unit dilayani setiap hari selama jam operasional ({jamOperasional}). Batas pengembalian adalah pukul 21.00 WIB di hari terakhir.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-2">
            <span className="font-bold text-[#234E5C] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#234E5C]" />
              Alat Telah Diuji &amp; Siap Pakai
            </span>
            <p className="text-[#5F7A84] leading-relaxed">
              Semua perlengkapan diinspeksi, diuji fungsi, dan dibersihkan sebelum diserahkan kepada penyewa agar langsung siap digunakan untuk aktivitas Anda.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-[28px] border border-[#2E5E4E]/30 bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
        <h3 className="text-xl sm:text-3xl font-extrabold text-[#1F2937]">
          Sudah Siap Memilih Peralatan?
        </h3>
        <p className="max-w-xl mx-auto text-sm text-[#5F7A84] leading-relaxed">
          Buka katalog untuk mengecek ketersediaan unit dan sewa alat sesuai tanggal yang Anda inginkan.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/alat">
            <Button variant="warm" size="lg" className="px-8 text-xs sm:text-sm font-bold gap-2">
              <span>Lihat Katalog Alat</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a
            href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="px-6 text-xs sm:text-sm font-bold gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <span>Hubungi Admin WhatsApp</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
