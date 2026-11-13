"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Printer,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SETTINGS, normalizeAdminPhone } from "@/lib/constants";
import { createWhatsAppLink } from "@/lib/payment-utils";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { H1, Lead } from "@/components/ui/typography";
import { Reveal } from "@/components/ui/motion";
import { useReducedMotion } from "motion/react";
import type {
  Booking,
  BookingItem,
  EquipmentItem,
  BookingStatusHistory,
  Payment,
  BookingReturn,
  DamageReport,
} from "@/types/database";

type BookingWithDetails = Booking & {
  items: (BookingItem & { equipment?: EquipmentItem | null })[];
  history: BookingStatusHistory[];
  payments: Payment[];
  returns?:
    | (BookingReturn & { damage_reports?: DamageReport[] })
    | (BookingReturn & { damage_reports?: DamageReport[] })[]
    | null;
};

export default function BookingSayaPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [bookings, setBookings] = React.useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isCancelling, setIsCancelling] = React.useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = React.useState<{ id: string; kode: string } | null>(null);
  const [whatsappAdmin, setWhatsappAdmin] = React.useState<string>(DEFAULT_SETTINGS.whatsapp_admin);

  React.useEffect(() => {
    async function loadBookings() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?next=/booking-saya");
          return;
        }

        // BUG-BS1: Fetch settings dengan await, bukan fire-and-forget
        const { data: waData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "whatsapp_admin")
          .single();
        if (waData?.value) {
          setWhatsappAdmin(normalizeAdminPhone(waData.value));
        }

        // Cek role pengguna: jika admin, arahkan ke panel Kelola Booking
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (prof?.role === "admin") {
          toast.info("Sebagai Administrator, Anda mengelola seluruh pesanan di menu Kelola Booking.");
          router.replace("/admin/booking");
          return;
        }

        const { data: bData, error } = await supabase
          .from("bookings")
          .select(`
            *,
            items:booking_items(*, equipment:equipment(*)),
            history:booking_status_history(*),
            payments(*),
            returns:booking_returns(*, damage_reports(*))
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && bData) {
          setBookings(bData as BookingWithDetails[]);
        }
      } catch (err) {
        console.error("Gagal memuat booking saya:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, [router]);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    const { id: bookingId, kode: bookingCode } = bookingToCancel;

    setIsCancelling(bookingId);
    try {
      const supabase = createClient();
      const { error: rpcErr } = await supabase.rpc("batalkan_booking", {
        p_booking_id: bookingId,
      });

      if (rpcErr) {
        const { error: updErr } = await supabase
          .from("bookings")
          .update({ status: "dibatalkan" })
          .eq("id", bookingId);

        if (updErr) throw updErr;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "dibatalkan" as const } : b))
      );

      toast.success(`Booking #${bookingCode} berhasil dibatalkan.`);
      setBookingToCancel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan pesanan.";
      toast.error(msg);
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
          <p className="text-sm text-[#5F7A84]">Memuat daftar pesanan sewa Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 space-y-8 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <H1 className="section-title block">
          BOOKING SAYA
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Pantau status verifikasi pembayaran uang muka, cetak surat jalan perjanjian, dan jadwal pengambilan unit sewa Anda.
        </Lead>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const dpPayment = booking.payments?.find((p) => p.jenis === "dp");
            const hasPendingProof = dpPayment?.status === "menunggu_verifikasi";
            const isDpVerified = booking.status === "dp_dibayar" || dpPayment?.status === "terverifikasi";
            const isRejected = dpPayment?.status === "ditolak";

            const cardContent = (
              <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
                {/* Header Kartu Booking */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#234E5C] px-2.5 py-1 rounded-lg bg-[#F3F3EF] border border-[#E8E8E1]">
                        {booking.kode_booking}
                      </span>
                      {hasPendingProof && booking.status === "menunggu_dp" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
                          Menunggu Verifikasi Admin
                        </span>
                      ) : (
                        <StatusBadge status={booking.status} />
                      )}
                    </div>
                    <p className="text-xs text-[#5F7A84] pt-0.5">
                      Dibuat pada {formatDateIndo(booking.created_at, "d MMMM yyyy, HH:mm")} WIB
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <Link
                      href={`/invoice/${booking.kode_booking}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E8E1] text-[#234E5C] bg-[#FAFAF8] hover:bg-[#F3F3EF] text-xs font-bold transition-colors"
                      title="Cetak Surat Perjanjian & Invoice Resmi"
                    >
                      <Printer className="h-3.5 w-3.5 text-[#234E5C]" />
                      <span>Cetak Invoice</span>
                    </Link>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-[#5F7A84] block">
                        Total Biaya Sewa
                      </span>
                      <span className="text-base font-extrabold text-[#A0630F]">
                        {formatRupiah(booking.total_harga)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jadwal dan Barang */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Jadwal Sewa */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                      Rentang Waktu Sewa
                    </h4>
                    <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-3.5 flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-[#234E5C] shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-[#234E5C]">
                          {formatDateIndo(booking.tanggal_mulai, "d MMM yyyy")} &rarr;{" "}
                          {formatDateIndo(booking.tanggal_selesai, "d MMM yyyy")}
                        </span>
                        <p className="text-[#5F7A84] text-[11px]">
                          Harap mengambil dan mengembalikan unit sesuai rentang tanggal tersebut.
                        </p>
                      </div>
                    </div>

                    {booking.pesan_admin && (
                      <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-3.5 flex items-start gap-2.5 text-xs text-[#78350F]">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Pesan dari Pengelola:</span>
                          <p>{booking.pesan_admin}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Daftar Peralatan */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                      Peralatan yang Disewa ({booking.items?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {booking.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#234E5C] shrink-0" />
                            <span className="font-bold text-[#234E5C]">
                              {item.equipment?.nama || "Alat Rental"}
                            </span>
                          </div>
                          <span className="font-semibold text-[#5F7A84]">
                            {item.qty} unit
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline Status Riwayat */}
                {booking.history && booking.history.length > 0 && (
                  <div className="pt-3 border-t border-[#E8E8E1] space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
                      Riwayat Perubahan Status
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {booking.history.map((hist, hIdx) => (
                        <div
                          key={hist.id || hIdx}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E8E8E1] bg-[#FAFAF8] text-[11px] text-[#5F7A84]"
                        >
                          <Clock className="h-3 w-3 text-[#234E5C]" />
                          <span className="font-semibold text-[#234E5C]">
                            {hist.status_baru.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-[#5F7A84]">
                            ({formatDateIndo(hist.created_at, "d MMM, HH:mm")})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PANEL STATUS PEMBAYARAN & TOMBOL AKSI CEPAT */}
                <div className="pt-4 border-t border-[#E8E8E1]">
                  {booking.status === "menunggu_dp" && (
                    <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#78350F] flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#A0630F]" />
                          {hasPendingProof
                            ? "Bukti Transfer Terkirim (Menunggu Verifikasi)"
                            : isRejected
                            ? "Bukti Pembayaran Ditolak"
                            : `Menunggu Pembayaran DP: ${formatRupiah(booking.dp_jumlah)}`}
                        </span>
                        <p className="text-[11px] text-[#78350F]/80">
                          {hasPendingProof
                            ? "Admin sedang mengecek mutasi transfer Anda. Estimasi 15-30 menit."
                            : isRejected
                            ? "Silakan unggah ulang bukti transfer yang jelas dan valid."
                            : "Transfer DP 30% dan kirim foto struk untuk mengamankan stok alat."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {!hasPendingProof && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isCancelling === booking.id}
                            onClick={() => setBookingToCancel({ id: booking.id, kode: booking.kode_booking })}
                            className="text-xs text-[#991B1B] hover:bg-[#FEE2E2]"
                          >
                            {isCancelling === booking.id ? "Membatalkan..." : "Batalkan"}
                          </Button>
                        )}

                        <Link href={`/pembayaran/${booking.kode_booking}`} className="flex-1 sm:flex-initial">
                          <Button
                            type="button"
                            variant={hasPendingProof ? "outline" : "warm"}
                            size="sm"
                            className="text-xs font-bold gap-1.5 w-full"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>
                              {hasPendingProof ? "Lihat Status Bayar" : "Bayar DP / Unggah Bukti"}
                            </span>
                          </Button>
                        </Link>

                        <a
                          href={createWhatsAppLink(
                            whatsappAdmin,
                            `Halo Admin PirantiKu, saya ingin konfirmasi terkait booking alat dengan kode: *${booking.kode_booking}*.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#A5D6A7] bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] text-xs font-semibold transition-colors shrink-0"
                          title="Hubungi Admin"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                          <span>Hubungi Admin</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {isDpVerified && (
                    <div className="rounded-xl border border-[#C5E1A5] bg-[#E2F0D9]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#2E5E4E] flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Uang Muka (DP) Terverifikasi!
                        </span>
                        <p className="text-[11px] text-[#2E5E4E]/80">
                          Jadwal alat telah dikunci. Bawa identitas asli (KTP/SIM) saat serah terima unit di gerai.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Link href={`/invoice/${booking.kode_booking}`} target="_blank" className="flex-1 sm:flex-initial">
                          <Button
                            type="button"
                            variant="petrol"
                            size="sm"
                            className="text-xs font-bold gap-1.5 w-full"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Invoice</span>
                          </Button>
                        </Link>

                        <Link href={`/pembayaran/${booking.kode_booking}`} className="flex-1 sm:flex-initial">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold gap-1.5 w-full text-[#234E5C]"
                          >
                            Rincian Sewa & Lokasi
                          </Button>
                        </Link>

                        <a
                          href={createWhatsAppLink(
                            whatsappAdmin,
                            `Halo Admin PirantiKu, DP untuk booking *${booking.kode_booking}* sudah terverifikasi. Kapan jadwal serah terima unit di gerai?`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#A5D6A7] bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] text-xs font-semibold transition-colors shrink-0"
                          title="Hubungi Admin"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                          <span>Hubungi Admin</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {booking.status === "diambil" && (
                    <div className="rounded-xl border border-[#DDD6FE] bg-[#EDE9FE]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#5B21B6] flex items-center gap-1.5">
                          <Package className="h-4 w-4" />
                          Peralatan Sedang Digunakan
                        </span>
                        <p className="text-[11px] text-[#5B21B6]/80">
                          Kembalikan alat paling lambat tanggal {formatDateIndo(booking.tanggal_selesai, "d MMM yyyy")} sebelum pukul 20.00 WIB.
                        </p>
                      </div>

                      <Link href={`/pembayaran/${booking.kode_booking}`} className="w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold w-full"
                        >
                          Rincian Booking
                        </Button>
                      </Link>
                    </div>
                  )}

                  {(booking.status === "selesai" ||
                    booking.status === "bermasalah" ||
                    booking.status === "dikembalikan") &&
                    (() => {
                      const returnRecord = Array.isArray(booking.returns)
                        ? booking.returns[0]
                        : booking.returns;
                      return (
                        <div className="rounded-xl border border-[#234E5C]/20 bg-[#234E5C]/5 p-4 space-y-3 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#234E5C] flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-[#2E5E4E]" />
                                Unit Telah Dikembalikan & Diinspeksi
                              </span>
                              <p className="text-[11px] text-[#5F7A84]">
                                {returnRecord
                                  ? `Pengembalian diverifikasi pada ${formatDateIndo(
                                      returnRecord.tanggal_dikembalikan,
                                      "d MMM yyyy, HH:mm"
                                    )} WIB.`
                                  : "Peminjaman alat ini telah selesai secara penuh."}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link href={`/invoice/${booking.kode_booking}`} target="_blank">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs font-bold gap-1 text-[#234E5C] border-[#234E5C]/30 hover:bg-[#234E5C]/10"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>Cetak Bukti</span>
                                </Button>
                              </Link>
                            </div>
                          </div>

                          {returnRecord && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#234E5C]/10">
                              <div className="p-2 rounded-lg bg-white border border-[#E8E8E1]">
                                <span className="text-[#5F7A84] block text-[10px] font-medium">
                                  Keterlambatan:
                                </span>
                                <span className="font-bold text-[#234E5C]">
                                  {returnRecord.hari_terlambat > 0
                                    ? `${returnRecord.hari_terlambat} Hari (${formatRupiah(
                                        returnRecord.denda_terlambat
                                      )})`
                                    : "Tepat Waktu"}
                                </span>
                              </div>

                              <div className="p-2 rounded-lg bg-white border border-[#E8E8E1]">
                                <span className="text-[#5F7A84] block text-[10px] font-medium">
                                  Kondisi Alat:
                                </span>
                                <span
                                  className={`font-bold ${
                                    returnRecord.total_ganti_rugi > 0
                                      ? "text-[#991B1B]"
                                      : "text-[#2E5E4E]"
                                  }`}
                                >
                                  {returnRecord.total_ganti_rugi > 0
                                    ? `Ganti Rugi: ${formatRupiah(returnRecord.total_ganti_rugi)}`
                                    : "Lengkap & Baik"}
                                </span>
                              </div>

                              <div className="p-2 rounded-lg bg-white border border-[#E8E8E1] col-span-2 sm:col-span-1">
                                <span className="text-[#5F7A84] block text-[10px] font-medium">
                                  Deposit Dikembalikan:
                                </span>
                                <span className="font-bold text-[#2E5E4E]">
                                  {formatRupiah(returnRecord.deposit_dikembalikan)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {booking.status === "dibatalkan" && (
                    <div className="p-3 rounded-lg bg-[#F1F5F9] text-xs text-[#475569] flex items-center justify-between">
                      <span>Pesanan sewa ini telah dibatalkan.</span>
                      <Link href="/alat">
                        <Button variant="ghost" size="sm" className="text-xs text-[#A0630F]">
                          Sewa Alat Lain
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );

            if (shouldReduceMotion) {
              return <div key={booking.id}>{cardContent}</div>;
            }

            return (
              <Reveal key={booking.id} duration={0.32}>
                {cardContent}
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-[#E8E8E1] bg-white space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F3EF] text-[#234E5C]">
            <Package className="h-8 w-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#234E5C]">
              Belum Ada Riwayat Booking
            </h3>
            <p className="text-xs text-[#5F7A84] max-w-sm">
              Anda belum pernah menyewa peralatan di PirantiKu. Buka katalog untuk mulai mencari perlengkapan kebutuhan Anda.
            </p>
          </div>
          <Link href="/alat">
            <Button variant="warm" className="px-6 text-xs font-bold">
              Buka Katalog Alat
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Info Bantuan */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5F7A84]">
        <div className="flex items-start sm:items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#234E5C] shrink-0 mt-0.5 sm:mt-0" />
          <p>
            Butuh konfirmasi cepat atau ada pertanyaan terkait pesanan Anda? Silakan hubungi admin kami via WhatsApp langsung.
          </p>
        </div>
        <a
          href={createWhatsAppLink(whatsappAdmin, "Halo Admin PirantiKu, saya ingin bertanya tentang pesanan booking alat saya.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shrink-0 transition-colors w-full sm:w-auto"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Hubungi Admin ({whatsappAdmin})</span>
        </a>
      </div>

      {/* Modal Konfirmasi Pembatalan Booking */}
      <Dialog
        open={!!bookingToCancel}
        onOpenChange={(open) => {
          if (!open) setBookingToCancel(null);
        }}
      >
        <DialogContent className="max-w-md bg-white border border-[#E8E8E1] p-6 rounded-2xl shadow-xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]">
              <AlertTriangle className="h-6 w-6 stroke-[2]" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#234E5C]">
              Batalkan Pesanan Sewa?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F7A84] leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan booking{" "}
              <strong className="text-[#234E5C]">#{bookingToCancel?.kode}</strong>? Jadwal
              dan unit alat yang telah Anda amankan akan dilepaskan kembali ke katalog umum.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-[#E8E8E1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBookingToCancel(null)}
              disabled={!!isCancelling}
              className="text-xs font-semibold h-10 flex-1"
            >
              Jangan Batalkan
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!!isCancelling}
              className="text-xs font-bold h-10 flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              {isCancelling ? "Membatalkan..." : "Ya, Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
