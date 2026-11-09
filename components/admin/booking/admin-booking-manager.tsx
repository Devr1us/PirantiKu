"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Package,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  ZoomIn,
  Printer,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RentalReturnModal } from "./rental-return-modal";
import type {
  Booking,
  BookingItem,
  EquipmentItem,
  Payment,
  Profile,
  BookingReturn,
  DamageReport,
} from "@/types/database";

export type AdminBookingWithDetails = Booking & {
  items?: (BookingItem & { equipment?: EquipmentItem | null })[];
  payments?: Payment[];
  profile?: Profile | null;
  returns?:
    | (BookingReturn & { damage_reports?: DamageReport[] })
    | (BookingReturn & { damage_reports?: DamageReport[] })[]
    | null;
};

interface AdminBookingManagerProps {
  initialBookings: AdminBookingWithDetails[];
  dendaPerHari?: number;
}

export function AdminBookingManager({
  initialBookings,
  dendaPerHari = 50000,
}: AdminBookingManagerProps) {
  const supabase = createClient();

  const [bookings, setBookings] = React.useState<AdminBookingWithDetails[]>(initialBookings);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("semua");
  const [selectedBooking, setSelectedBooking] = React.useState<AdminBookingWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState<boolean>(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = React.useState<boolean>(false);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [rejectReason, setRejectReason] = React.useState<string>("");
  const [isRejectFormOpen, setIsRejectFormOpen] = React.useState<boolean>(false);
  const [isZoomImageOpen, setIsZoomImageOpen] = React.useState<boolean>(false);
  const [zoomImageSrc, setZoomImageSrc] = React.useState<string | null>(null);
  const [zoomImageTitle, setZoomImageTitle] = React.useState<string>("Pratinjau Foto");

  // Filter list
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      // 1. Filter status
      if (statusFilter === "perlu_verifikasi") {
        const hasUnverified = b.payments?.some((p) => p.status === "menunggu_verifikasi");
        if (!hasUnverified) return false;
      } else if (statusFilter !== "semua" && b.status !== statusFilter) {
        return false;
      }

      // 2. Filter search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const codeMatch = b.kode_booking.toLowerCase().includes(q);
      const nameMatch = b.profile?.nama?.toLowerCase().includes(q);
      const phoneMatch = b.profile?.no_hp?.toLowerCase().includes(q);
      return codeMatch || nameMatch || phoneMatch;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Hitung jumlah yang perlu verifikasi
  const pendingVerificationCount = React.useMemo(() => {
    return bookings.filter((b) =>
      b.payments?.some((p) => p.status === "menunggu_verifikasi")
    ).length;
  }, [bookings]);

  // Aksi 1: Verifikasi Pembayaran DP
  const handleVerifyDp = async (booking: AdminBookingWithDetails) => {
    setIsProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const latestPayment = booking.payments?.find(
        (p) => p.jenis === "dp" && p.status === "menunggu_verifikasi"
      );

      // 1. Update status pembayaran ke terverifikasi
      if (latestPayment) {
        await supabase
          .from("payments")
          .update({
            status: "terverifikasi",
            diverifikasi_oleh: user?.id || null,
          })
          .eq("id", latestPayment.id);
      }

      // 2. Update status booking ke dp_dibayar
      const { error: bErr } = await supabase
        .from("bookings")
        .update({
          status: "dp_dibayar",
          pesan_admin: "Pembayaran DP telah diverifikasi admin. Pesanan siap dijadwalkan.",
        })
        .eq("id", booking.id);

      if (bErr) throw bErr;

      // 3. Catat riwayat status
      try {
        await supabase.from("booking_status_history").insert({
          booking_id: booking.id,
          status_lama: booking.status,
          status_baru: "dp_dibayar",
        });
      } catch {
        // Abaikan jika trigger db sudah menangani
      }

      // Update state lokal
      setBookings((prev) =>
        prev.map((item) => {
          if (item.id === booking.id) {
            return {
              ...item,
              status: "dp_dibayar",
              pesan_admin: "Pembayaran DP telah diverifikasi admin. Pesanan siap dijadwalkan.",
              payments: item.payments?.map((p) =>
                latestPayment && p.id === latestPayment.id
                  ? { ...p, status: "terverifikasi" as const }
                  : p
              ),
            };
          }
          return item;
        })
      );

      toast.success(`Pembayaran DP booking #${booking.kode_booking} berhasil diverifikasi!`);
      setIsDetailOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memverifikasi DP.";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Aksi 2: Tolak Bukti Transfer
  const handleRejectPayment = async (booking: AdminBookingWithDetails) => {
    if (!rejectReason.trim()) {
      toast.error("Mohon isi alasan penolakan bukti transfer.");
      return;
    }

    setIsProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const latestPayment = booking.payments?.find(
        (p) => p.jenis === "dp" && p.status === "menunggu_verifikasi"
      );

      if (latestPayment) {
        await supabase
          .from("payments")
          .update({
            status: "ditolak",
            diverifikasi_oleh: user?.id || null,
          })
          .eq("id", latestPayment.id);
      }

      const reasonMsg = `Bukti transfer ditolak: ${rejectReason.trim()}`;

      await supabase
        .from("bookings")
        .update({
          pesan_admin: reasonMsg,
        })
        .eq("id", booking.id);

      setBookings((prev) =>
        prev.map((item) => {
          if (item.id === booking.id) {
            return {
              ...item,
              pesan_admin: reasonMsg,
              payments: item.payments?.map((p) =>
                latestPayment && p.id === latestPayment.id
                  ? { ...p, status: "ditolak" as const }
                  : p
              ),
            };
          }
          return item;
        })
      );

      toast.success("Bukti transfer ditolak dan alasan telah disampaikan ke penyewa.");
      setIsRejectFormOpen(false);
      setRejectReason("");
      setIsDetailOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak bukti pembayaran.";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Aksi 3: Ubah status booking langsung (Ambil, Selesai, Batalkan)
  const handleChangeBookingStatus = async (
    booking: AdminBookingWithDetails,
    newStatus: "diambil" | "selesai" | "dibatalkan"
  ) => {
    setIsProcessing(true);
    try {
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
      };

      if (newStatus === "diambil") {
        updatePayload.tanggal_diambil = new Date().toISOString();
      }

      const { error } = await supabase
        .from("bookings")
        .update(updatePayload)
        .eq("id", booking.id);

      if (error) throw error;

      try {
        await supabase.from("booking_status_history").insert({
          booking_id: booking.id,
          status_lama: booking.status,
          status_baru: newStatus,
        });
      } catch {
        // Silent
      }

      setBookings((prev) =>
        prev.map((item) => (item.id === booking.id ? { ...item, status: newStatus } : item))
      );

      toast.success(`Status booking #${booking.kode_booking} diubah menjadi ${newStatus}.`);
      setIsDetailOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status.";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Callback setelah proses pengembalian & inspeksi fisik berhasil
  const handleReturnSuccess = async () => {
    setIsReturnModalOpen(false);
    setIsDetailOpen(false);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          items:booking_items(*, equipment:equipment(*)),
          payments(*),
          profile:profiles(*),
          returns:booking_returns(*, damage_reports(*))
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookings(data as AdminBookingWithDetails[]);
      }
    } catch (err) {
      console.error("Gagal refresh data booking:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Bar Tab Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("semua")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "semua"
                ? "bg-[#234E5C] text-white"
                : "bg-white border border-[#E8E8E1] text-[#5F7A84] hover:text-[#234E5C]"
            }`}
          >
            Semua ({bookings.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("perlu_verifikasi")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === "perlu_verifikasi"
                ? "bg-[#A0630F] text-white"
                : "bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] hover:bg-[#FDE68A]"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Perlu Cek Bukti</span>
            {pendingVerificationCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-[#DC2626] text-white text-[10px] flex items-center justify-center font-extrabold ml-0.5">
                {pendingVerificationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("menunggu_dp")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "menunggu_dp"
                ? "bg-[#234E5C] text-white"
                : "bg-white border border-[#E8E8E1] text-[#5F7A84] hover:text-[#234E5C]"
            }`}
          >
            Menunggu DP
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("dp_dibayar")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "dp_dibayar"
                ? "bg-[#234E5C] text-white"
                : "bg-white border border-[#E8E8E1] text-[#5F7A84] hover:text-[#234E5C]"
            }`}
          >
            DP Terverifikasi
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("diambil")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "diambil"
                ? "bg-[#234E5C] text-white"
                : "bg-white border border-[#E8E8E1] text-[#5F7A84] hover:text-[#234E5C]"
            }`}
          >
            Sedang Disewa
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("selesai")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "selesai"
                ? "bg-[#2E5E4E] text-white"
                : "bg-white border border-[#E8E8E1] text-[#5F7A84] hover:text-[#2E5E4E]"
            }`}
          >
            Selesai Dikembalikan
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("bermasalah")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "bermasalah"
                ? "bg-[#991B1B] text-white"
                : "bg-white border border-[#E8E8E1] text-[#5F7A84] hover:text-[#991B1B]"
            }`}
          >
            Bermasalah
          </button>
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F7A84]" />
          <Input
            placeholder="Cari kode booking / nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white rounded-full border-[#E8E8E1]"
          />
        </div>
      </div>

      {/* 2. Tabel Transaksi Booking Interaktif */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
            Daftar Booking ({filteredBookings.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Penyewa</th>
                <th className="py-3 px-4">Status Booking</th>
                <th className="py-3 px-4">Status Pembayaran</th>
                <th className="py-3 px-4">Jadwal Sewa</th>
                <th className="py-3 px-4">Total Biaya & DP</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const dpPayment = b.payments?.find((p) => p.jenis === "dp");
                  const hasPendingProof = dpPayment?.status === "menunggu_verifikasi";

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-[#F3F3EF]/60 transition-colors ${
                        hasPendingProof ? "bg-[#FEF3C7]/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#234E5C]">
                        {b.kode_booking}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#234E5C] block">
                          {b.profile?.nama || "Penyewa"}
                        </span>
                        <span className="text-[11px] text-[#5F7A84]">
                          {b.profile?.no_hp || "-"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        {dpPayment ? (
                          dpPayment.status === "menunggu_verifikasi" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] animate-pulse">
                              <Clock className="h-3 w-3 text-[#A0630F]" />
                              Perlu Cek Bukti
                            </span>
                          ) : dpPayment.status === "terverifikasi" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
                              <CheckCircle2 className="h-3 w-3" />
                              DP Terverifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                              <XCircle className="h-3 w-3" />
                              Ditolak
                            </span>
                          )
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F3EF] text-[#5F7A84]">
                            Belum Ada Bukti
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#5F7A84] font-medium">
                        {formatDateIndo(b.tanggal_mulai, "d MMM")} &rarr;{" "}
                        {formatDateIndo(b.tanggal_selesai, "d MMM yyyy")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#234E5C] block">
                          {formatRupiah(b.total_harga)}
                        </span>
                        <span className="text-[11px] font-semibold text-[#A0630F]">
                          DP: {formatRupiah(b.dp_jumlah)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant={hasPendingProof ? "warm" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailOpen(true);
                            setIsRejectFormOpen(false);
                            setRejectReason("");
                          }}
                          className="text-xs font-bold gap-1 h-8 px-3"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{hasPendingProof ? "Verifikasi" : "Detail"}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F7A84]">
                    Tidak ada transaksi booking yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DIALOG DETAIL BOOKING & VERIFIKASI ADMIN */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3 pr-6">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5F7A84] block">
                      Detail Transaksi Rental
                    </span>
                    <DialogTitle className="text-lg font-bold text-[#234E5C] mt-0.5">
                      Booking #{selectedBooking.kode_booking}
                    </DialogTitle>
                  </div>
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </DialogHeader>

              {/* Data Penyewa */}
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-3 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#234E5C]" />
                  Informasi Pelanggan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#5F7A84] block text-[11px]">Nama Penyewa:</span>
                    <span className="font-bold text-[#234E5C]">
                      {selectedBooking.profile?.nama || "Penyewa"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5F7A84] block text-[11px]">No. WhatsApp / HP:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#234E5C]">
                        {selectedBooking.profile?.no_hp || "-"}
                      </span>
                      {selectedBooking.profile?.no_hp && (
                        <a
                          href={`https://wa.me/${selectedBooking.profile.no_hp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#A0630F] hover:underline inline-flex items-center gap-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Chat
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {selectedBooking.catatan_penyewa && (
                  <div className="border-t border-[#E8E8E1] pt-2 text-xs">
                    <span className="text-[#5F7A84] font-medium block text-[11px]">
                      Catatan Tambahan Penyewa:
                    </span>
                    <p className="text-[#234E5C] italic mt-0.5">
                      &quot;{selectedBooking.catatan_penyewa}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Barang yang disewa */}
              <div className="space-y-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5 text-[11px]">
                  <Package className="h-3.5 w-3.5 text-[#234E5C]" />
                  Peralatan yang Disewa ({selectedBooking.items?.length || 0})
                </span>
                <div className="space-y-2 rounded-xl border border-[#E8E8E1] p-3 bg-white">
                  {selectedBooking.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs border-b border-[#E8E8E1]/50 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <span className="font-bold text-[#234E5C] block">
                          {item.equipment?.nama || "Alat Rental"}
                        </span>
                        <span className="text-[11px] text-[#5F7A84]">
                          {item.qty} unit x {formatRupiah(item.harga_per_hari)}/hari
                        </span>
                      </div>
                      <span className="font-bold text-[#234E5C]">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BUKTI TRANSFER & PEMBAYARAN */}
              {(() => {
                const dpPayment = selectedBooking.payments?.find((p) => p.jenis === "dp");
                return (
                  <div className="p-4 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-2">
                      <span className="font-bold uppercase tracking-wider text-[#5F7A84] text-[11px]">
                        Bukti Pembayaran Uang Muka (DP)
                      </span>
                      <span className="text-base font-extrabold text-[#A0630F]">
                        Tagihan: {formatRupiah(selectedBooking.dp_jumlah)}
                      </span>
                    </div>

                    {dpPayment?.bukti_url ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          {/* Gambar Bukti */}
                          <div
                            onClick={() => {
                              if (dpPayment?.bukti_url) {
                                setZoomImageSrc(dpPayment.bukti_url);
                                setZoomImageTitle(`Bukti Transfer #${selectedBooking.kode_booking}`);
                                setIsZoomImageOpen(true);
                              }
                            }}
                            className="relative h-44 w-36 sm:w-44 rounded-xl overflow-hidden border border-[#E8E8E1] shadow-xs cursor-pointer group bg-black/5 shrink-0"
                          >
                            <img
                              src={dpPayment.bukti_url}
                              alt="Bukti Transfer"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                              <ZoomIn className="h-4 w-4" />
                              <span>Klik Zoom</span>
                            </div>
                          </div>

                          {/* Data Transfer */}
                          <div className="space-y-2 text-xs flex-1">
                            <div>
                              <span className="text-[#5F7A84] block text-[11px]">Metode:</span>
                              <span className="font-bold text-[#234E5C]">{dpPayment.metode}</span>
                            </div>
                            <div>
                              <span className="text-[#5F7A84] block text-[11px]">Waktu Diunggah:</span>
                              <span className="font-semibold text-[#234E5C]">
                                {formatDateIndo(dpPayment.dibayar_pada, "d MMMM yyyy, HH:mm")} WIB
                              </span>
                            </div>
                            <div>
                              <span className="text-[#5F7A84] block text-[11px]">Status Bukti:</span>
                              <span className="font-bold capitalize text-[#A0630F]">
                                {dpPayment.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border border-dashed border-[#E8E8E1] text-center text-[#5F7A84]">
                        <Clock className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <p className="font-semibold">Pelanggan belum mengunggah foto bukti transfer.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* LAPORAN PENGEMBALIAN & CEK FISIK UNIT JIKA SUDAH DIKEMBALIKAN */}
              {(() => {
                const returnRecord = Array.isArray(selectedBooking.returns)
                  ? selectedBooking.returns[0]
                  : selectedBooking.returns;

                if (!returnRecord) return null;

                const damageReports = returnRecord.damage_reports || [];
                const hasDamages = damageReports.length > 0;

                return (
                  <div className="p-4 rounded-xl border border-[#234E5C]/20 bg-[#234E5C]/5 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-[#234E5C]/15 pb-2.5">
                      <span className="font-bold uppercase tracking-wider text-[#234E5C] text-[11px] flex items-center gap-1.5">
                        <RotateCcw className="h-4 w-4 text-[#A0630F]" />
                        Laporan Pengembalian & Cek Fisik Unit
                      </span>
                      <span className="text-[11px] font-bold text-[#5F7A84]">
                        {formatDateIndo(returnRecord.tanggal_dikembalikan, "d MMM yyyy, HH:mm")} WIB
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-lg bg-white border border-[#E8E8E1]">
                        <span className="text-[#5F7A84] block text-[10px] font-bold uppercase">
                          Keterlambatan
                        </span>
                        <span className="font-extrabold text-sm text-[#234E5C] block">
                          {returnRecord.hari_terlambat > 0
                            ? `${returnRecord.hari_terlambat} Hari`
                            : "Tepat Waktu"}
                        </span>
                        {returnRecord.denda_terlambat > 0 && (
                          <span className="text-[10px] font-bold text-[#991B1B] block mt-0.5">
                            Denda: {formatRupiah(returnRecord.denda_terlambat)}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-[#E8E8E1]">
                        <span className="text-[#5F7A84] block text-[10px] font-bold uppercase">
                          Status Fisik Alat
                        </span>
                        <span
                          className={`font-extrabold text-sm block ${
                            hasDamages ? "text-[#991B1B]" : "text-[#2E5E4E]"
                          }`}
                        >
                          {hasDamages ? `${damageReports.length} Kerusakan/Hilang` : "Lengkap & Prima"}
                        </span>
                        <span className="text-[10px] font-bold text-[#5F7A84] block mt-0.5">
                          Ganti Rugi: {formatRupiah(returnRecord.total_ganti_rugi)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-[#E8E8E1]">
                        <span className="text-[#5F7A84] block text-[10px] font-bold uppercase">
                          Penyelesaian Deposit
                        </span>
                        <span className="font-extrabold text-sm text-[#2E5E4E] block">
                          {formatRupiah(returnRecord.deposit_dikembalikan)}
                        </span>
                        <span className="text-[10px] text-[#5F7A84] block mt-0.5">
                          Dikembalikan ke penyewa
                        </span>
                      </div>
                    </div>

                    {/* Rincian Kerusakan jika ada */}
                    {hasDamages && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-[#991B1B] block">
                          Catatan Kerusakan yang Dilaporkan:
                        </span>
                        <div className="space-y-2">
                          {damageReports.map((dmg) => (
                            <div
                              key={dmg.id}
                              className="p-2.5 rounded-lg bg-white border border-[#FECACA] flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#FEE2E2] text-[#991B1B]">
                                    {dmg.jenis.replace("_", " ")}
                                  </span>
                                  <span className="font-bold text-[#234E5C]">
                                    Jumlah: {dmg.jumlah} unit
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5F7A84] italic">
                                  &quot;{dmg.deskripsi}&quot;
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-bold text-[#991B1B] block">
                                  {formatRupiah(dmg.biaya_ganti_rugi)}
                                </span>
                                {dmg.foto_url && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setZoomImageSrc(dmg.foto_url);
                                      setZoomImageTitle(
                                        `Foto Kerusakan - ${dmg.jenis.replace("_", " ")}`
                                      );
                                      setIsZoomImageOpen(true);
                                    }}
                                    className="text-[10px] text-[#A0630F] font-bold underline hover:text-[#234E5C] cursor-pointer"
                                  >
                                    Lihat Foto
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {returnRecord.catatan && (
                      <div className="text-xs pt-1 border-t border-[#234E5C]/10 text-[#5F7A84]">
                        <span className="font-bold block text-[10px] uppercase">
                          Catatan Petugas Pengembalian:
                        </span>
                        <p className="italic text-[#234E5C] mt-0.5">&quot;{returnRecord.catatan}&quot;</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* FORM PENOLAKAN JIKA DIBUKA */}
              {isRejectFormOpen && (
                <div className="p-4 rounded-xl border border-[#FECACA] bg-[#FEE2E2]/30 space-y-3 text-xs">
                  <h4 className="font-bold text-[#991B1B]">Alasan Penolakan Bukti Transfer:</h4>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Nominal transfer kurang Rp50.000, atau mutasi belum masuk..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-xl border border-[#FECACA] bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRejectFormOpen(false)}
                      className="text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleRejectPayment(selectedBooking)}
                      className="text-xs font-bold"
                    >
                      Konfirmasi Tolak Bukti
                    </Button>
                  </div>
                </div>
              )}

              {/* TOMBOL AKSI OPERASIONAL ADMIN */}
              <div className="border-t border-[#E8E8E1] pt-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
                  Aksi Operasional
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Verifikasi DP jika ada bukti belum diverifikasi */}
                  {selectedBooking.payments?.some((p) => p.status === "menunggu_verifikasi") && (
                    <>
                      <Button
                        type="button"
                        variant="warm"
                        disabled={isProcessing}
                        onClick={() => handleVerifyDp(selectedBooking)}
                        className="text-xs font-bold gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Terima & Verifikasi DP
                      </Button>

                      {!isRejectFormOpen && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isProcessing}
                          onClick={() => setIsRejectFormOpen(true)}
                          className="text-xs font-bold text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2]"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Tolak Bukti
                        </Button>
                      )}
                    </>
                  )}

                  {/* Serah Terima Alat jika sudah dp_dibayar */}
                  {selectedBooking.status === "dp_dibayar" && (
                    <Button
                      type="button"
                      variant="warm"
                      disabled={isProcessing}
                      onClick={() => handleChangeBookingStatus(selectedBooking, "diambil")}
                      className="text-xs font-bold gap-1.5"
                    >
                      <Package className="h-4 w-4" />
                      Serah Terima Unit (Tandai Diambil)
                    </Button>
                  )}

                  {/* Pengembalian & Cek Fisik jika sedang disewa atau terlambat */}
                  {(selectedBooking.status === "diambil" || selectedBooking.status === "terlambat") && (
                    <Button
                      type="button"
                      variant="warm"
                      disabled={isProcessing}
                      onClick={() => setIsReturnModalOpen(true)}
                      className="text-xs font-bold gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Proses Pengembalian & Cek Fisik
                    </Button>
                  )}

                  {/* Cetak Surat Perjanjian & Invoice */}
                  <Link
                    href={`/invoice/${selectedBooking.kode_booking}`}
                    target="_blank"
                    className="inline-flex"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs font-bold gap-1.5 text-[#234E5C] border-[#234E5C] hover:bg-[#234E5C] hover:text-white"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Cetak Surat Jalan & Invoice</span>
                    </Button>
                  </Link>

                  {/* Batalkan booking jika belum diambil */}
                  {selectedBooking.status === "menunggu_dp" && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isProcessing}
                      onClick={() => handleChangeBookingStatus(selectedBooking, "dibatalkan")}
                      className="text-xs text-[#991B1B] hover:bg-[#FEE2E2]"
                    >
                      Batalkan Booking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL ZOOM GAMBAR UNIVERSAL */}
      <Dialog open={isZoomImageOpen} onOpenChange={setIsZoomImageOpen}>
        <DialogContent className="max-w-3xl bg-white p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#234E5C]">
              {zoomImageTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-[80vh] overflow-auto rounded-xl border border-[#E8E8E1] p-2 flex items-center justify-center bg-[#F3F3EF]">
            {zoomImageSrc && (
              <img
                src={zoomImageSrc}
                alt="Zoom"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL PROSES PENGEMBALIAN & CEK KERUSAKAN FISIK */}
      {selectedBooking && isReturnModalOpen && (
        <RentalReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          booking={selectedBooking}
          dendaPerHari={dendaPerHari}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}

export default AdminBookingManager;
