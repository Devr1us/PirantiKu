import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
  Calendar,
  Package,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  Clock,
  Phone,
  Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PaymentFlow } from "@/components/payment/payment-flow";
import { StatusBadge } from "@/components/ui/status-badge";
import { H1, Lead } from "@/components/ui/typography";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { APP_NAME, DEFAULT_SETTINGS, LOKASI_DEFAULT } from "@/lib/constants";
import type { Booking, BookingItem, EquipmentItem, Payment } from "@/types/database";

interface PembayaranPageProps {
  params: Promise<{ kode: string }>;
}

export async function generateMetadata({
  params,
}: PembayaranPageProps): Promise<Metadata> {
  const { kode } = await params;
  return {
    title: `Pembayaran Booking #${kode} | ${APP_NAME}`,
    description: `Instruksi dan verifikasi pembayaran uang muka untuk booking rental ${APP_NAME}.`,
  };
}

type BookingPaymentDetails = Booking & {
  items: (BookingItem & { equipment?: EquipmentItem | null })[];
  payments: Payment[];
};

export default async function PembayaranPage({ params }: PembayaranPageProps) {
  const { kode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/pembayaran/${kode}`);
  }

  // 1. Ambil data booking berdasarkan kode_booking atau id
  let bookingData: BookingPaymentDetails | null = null;

  const { data: bByCode } = await supabase
    .from("bookings")
    .select(`
      *,
      items:booking_items(*, equipment:equipment(*)),
      payments(*)
    `)
    .eq("kode_booking", kode)
    .single();

  if (bByCode) {
    bookingData = bByCode as unknown as BookingPaymentDetails;
  } else {
    const { data: bById } = await supabase
      .from("bookings")
      .select(`
        *,
        items:booking_items(*, equipment:equipment(*)),
        payments(*)
      `)
      .eq("id", kode)
      .single();

    if (bById) {
      bookingData = bById as unknown as BookingPaymentDetails;
    }
  }

  if (!bookingData) {
    notFound();
    return null;
  }

  const booking = bookingData;

  // Verifikasi pemilik booking atau admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = booking.user_id === user.id;

  if (!isOwner && !isAdmin) {
    redirect("/booking-saya");
  }

  // 2. Ambil pengaturan rekening & kontak
  let rekeningBank = DEFAULT_SETTINGS.rekening_bank;
  let qrisUrl = DEFAULT_SETTINGS.qris_url;
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;
  let alamat = LOKASI_DEFAULT.alamat;

  const { data: setList } = await supabase.from("settings").select("key, value");
  if (setList) {
    setList.forEach((s) => {
      if (s.key === "rekening_bank" && s.value) rekeningBank = s.value;
      if (s.key === "qris_url" && s.value) qrisUrl = s.value;
      if (s.key === "whatsapp_admin" && s.value) whatsappAdmin = s.value;
      if (s.key === "alamat" && s.value) alamat = s.value;
    });
  }

  const customerName = profile?.nama || "Penyewa";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-[#FAFAF8] text-[#234E5C]">
      {/* Breadcrumbs & Header */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#5F7A84]">
          <Link href="/booking-saya" className="hover:text-[#234E5C] font-semibold flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Booking Saya
          </Link>
          <span>/</span>
          <span>Pembayaran</span>
          <span>/</span>
          <span className="font-mono font-bold text-[#234E5C]">#{booking.kode_booking}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <H1 className="section-title block">PEMBAYARAN SEWA</H1>
            <Lead className="text-sm text-[#5F7A84] font-medium">
              Selesaikan uang muka (DP) untuk mengunci jadwal peminjaman unit alat Anda.
            </Lead>
          </div>
          <div className="self-start sm:self-auto flex items-center gap-2">
            {booking.payments?.some((p) => p.status === "menunggu_verifikasi") && booking.status === "menunggu_dp" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
                Menunggu Verifikasi Admin
              </span>
            ) : (
              <StatusBadge status={booking.status} />
            )}
            <Link
              href={`/invoice/${booking.kode_booking}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E8E8E1] text-[#234E5C] bg-white hover:bg-[#F3F3EF] text-xs font-bold transition-colors"
              title="Cetak Surat Perjanjian & Invoice"
            >
              <Printer className="h-3.5 w-3.5 text-[#234E5C]" />
              <span>Cetak Invoice</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Konten Utama: Kiri Form Pembayaran, Kanan Ringkasan Pesanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Alur Pembayaran & Upload Bukti (7 Kolom) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <PaymentFlow
            booking={{
              id: booking.id,
              kode_booking: booking.kode_booking,
              status: booking.status,
              total_harga: booking.total_harga,
              dp_jumlah: booking.dp_jumlah,
              deposit: booking.deposit,
              tanggal_mulai: booking.tanggal_mulai,
              tanggal_selesai: booking.tanggal_selesai,
              created_at: booking.created_at,
              pesan_admin: booking.pesan_admin,
              catatan_penyewa: booking.catatan_penyewa,
            }}
            customerName={customerName}
            initialPayments={booking.payments || []}
            rekeningBank={rekeningBank}
            qrisUrl={qrisUrl}
            whatsappAdmin={whatsappAdmin}
            showBackToHome={true}
          />
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan & Item Alat (5 Kolom) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Kartu Ringkasan Barang */}
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#234E5C]" />
              Peralatan yang Disewa ({booking.items?.length || 0})
            </h3>

            {/* Jadwal Rentang Sewa */}
            <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-1 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#234E5C]" />
                Jadwal Sewa
              </span>
              <p className="font-bold text-[#234E5C]">
                {formatDateIndo(booking.tanggal_mulai, "d MMM yyyy")} &rarr;{" "}
                {formatDateIndo(booking.tanggal_selesai, "d MMM yyyy")}
              </p>
            </div>

            {/* List Alat */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {booking.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs border-b border-[#E8E8E1]/60 pb-2">
                  <div>
                    <span className="font-bold text-[#234E5C] line-clamp-1">
                      {item.equipment?.nama || "Alat Rental"}
                    </span>
                    <span className="text-[11px] text-[#5F7A84]">
                      {item.qty} unit x {formatRupiah(item.harga_per_hari)}/hari
                    </span>
                  </div>
                  <span className="font-bold text-[#234E5C] shrink-0 ml-2">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Ringkasan Biaya */}
            <div className="border-t border-[#E8E8E1] pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#5F7A84]">
                <span>Total Sewa Alat</span>
                <span className="font-bold text-[#234E5C]">
                  {formatRupiah(booking.total_harga)}
                </span>
              </div>
              <div className="flex justify-between text-[#5F7A84]">
                <span>Deposit Jaminan (Kembali)</span>
                <span className="font-bold text-[#234E5C]">
                  {formatRupiah(booking.deposit)}
                </span>
              </div>
              <div className="flex justify-between text-[#A0630F] font-bold border-t border-[#E8E8E1] pt-2">
                <span>DP 30% (Dibayar Sekarang)</span>
                <span>{formatRupiah(booking.dp_jumlah)}</span>
              </div>
              <div className="flex justify-between text-[#5F7A84] text-[11px]">
                <span>Pelunasan saat serah terima</span>
                <span className="font-semibold text-[#234E5C]">
                  {formatRupiah(booking.total_harga - booking.dp_jumlah + booking.deposit)}
                </span>
              </div>
            </div>
          </div>

          {/* Kartu Syarat & Pengambilan */}
          <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-[#234E5C] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#2E5E4E]" />
              Ketentuan Pengambilan Alat:
            </h4>
            <ul className="space-y-1.5 text-[#5F7A84] list-disc list-inside text-[11px] leading-relaxed">
              <li>Membawa KTP atau SIM asli atas nama pemesan untuk jaminan identitas fisik.</li>
              <li>Sisa biaya sewa & deposit jaminan dilunasi di toko saat serah terima unit.</li>
              <li>Pengecekan fungsi & kondisi alat dilakukan bersama sebelum serah terima.</li>
              <li>Deposit akan dikembalikan 100% penuh saat alat kembali tepat waktu dan dalam kondisi baik.</li>
            </ul>
          </div>

          {/* Alamat Toko */}
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 shadow-sm space-y-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#234E5C]" />
              Lokasi Toko PirantiKu
            </span>
            <p className="text-[#234E5C] font-semibold leading-relaxed">
              {alamat}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
