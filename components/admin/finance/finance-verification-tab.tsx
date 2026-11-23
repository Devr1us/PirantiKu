"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ZoomIn,
  AlertTriangle,
  User,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { PAYMENT_JENIS_LABELS } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface VerificationItem {
  id: number;
  booking_id: string;
  jenis: string;
  arah: string;
  jumlah: number;
  metode: string;
  bukti_url: string | null;
  status: string;
  created_at: string;
  catatan?: string | null;
  booking?: {
    id: string;
    kode_booking: string;
    status: string;
    profile?: {
      id: string;
      nama: string;
      no_hp: string;
    } | null;
  } | null;
}

interface FinanceVerificationTabProps {
  onActionSuccess?: () => void;
}

export function FinanceVerificationTab({ onActionSuccess }: FinanceVerificationTabProps) {
  const [items, setItems] = React.useState<VerificationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);

  // Modal zoom bukti
  const [zoomUrl, setZoomUrl] = React.useState<string | null>(null);

  // Dialog konfirmasi setujui
  const [selectedForApprove, setSelectedForApprove] = React.useState<VerificationItem | null>(null);

  // Modal tolak dengan alasan
  const [selectedForReject, setSelectedForReject] = React.useState<VerificationItem | null>(null);
  const [rejectReason, setRejectReason] = React.useState<string>("");

  const fetchPending = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/finance/transactions?status=menunggu_verifikasi&limit=100");
      const json = await res.json();
      if (json.data) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat antrean pembayaran:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Eksekusi Persetujuan
  const handleApprove = async () => {
    if (!selectedForApprove) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/finance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedForApprove.id,
          status: "terverifikasi",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyetujui pembayaran.");

      toast.success(
        `Pembayaran ${formatRupiah(selectedForApprove.jumlah)} untuk booking #${selectedForApprove.booking?.kode_booking} berhasil disetujui!`
      );
      setSelectedForApprove(null);
      fetchPending();
      onActionSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Eksekusi Penolakan
  const handleReject = async () => {
    if (!selectedForReject) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan bukti pembayaran wajib diisi.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/finance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedForReject.id,
          status: "ditolak",
          alasan: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menolak pembayaran.");

      toast.success(
        `Pembayaran untuk booking #${selectedForReject.booking?.kode_booking} ditolak dengan alasan yang telah disampaikan.`
      );
      setSelectedForReject(null);
      setRejectReason("");
      fetchPending();
      onActionSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#A0630F]" />
            <span>Verifikasi Pembayaran Masuk</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#78350F]">
              {items.length} Menunggu
            </span>
          </h2>
          <p className="text-xs text-[#5F7A84]">
            Tinjau bukti bayar transfer bank atau QRIS dari pelanggan sebelum menyetujui transaksi.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPending}
          disabled={isLoading}
          className="text-xs border-[#E8E8E1] text-[#234E5C]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Segarkan Data
        </Button>
      </div>

      {/* Konten Antrean */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#5F7A84] bg-white rounded-2xl border border-[#E8E8E1]">
          Memuat antrean verifikasi pembayaran...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E8E1] space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-[#234E5C]">Tidak Ada Antrean Pembayaran</h3>
          <p className="text-xs text-[#5F7A84] max-w-md mx-auto">
            Semua bukti pembayaran masuk telah diverifikasi dan diselesaikan. Anda akan diberi tahu jika ada bukti pembayaran baru yang diunggah.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const jenisLabel = PAYMENT_JENIS_LABELS[it.jenis as keyof typeof PAYMENT_JENIS_LABELS] || it.jenis;
            return (
              <div
                key={it.id}
                className="p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  {/* Baris Kode & Nominal */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#E8E8E1] pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-[#5F7A84] uppercase">
                        {jenisLabel}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Link
                          href={`/admin/booking?q=${it.booking?.kode_booking}`}
                          className="text-xs font-bold text-[#234E5C] hover:underline"
                        >
                          #{it.booking?.kode_booking}
                        </Link>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#A0630F]">
                      {formatRupiah(it.jumlah)}
                    </span>
                  </div>

                  {/* Info Pelanggan & Metode */}
                  <div className="text-xs space-y-1 text-[#234E5C]">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-[#5F7A84] shrink-0" />
                      <span className="font-semibold truncate">
                        {it.booking?.profile?.nama || "Pelanggan"}
                      </span>
                      <span className="text-[10px] text-[#5F7A84]">
                        ({it.booking?.profile?.no_hp || "-"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-[#5F7A84] shrink-0" />
                      <span className="text-[11px] text-[#5F7A84] truncate">
                        {it.metode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#5F7A84] shrink-0" />
                      <span className="text-[10px] text-[#5F7A84]">
                        {formatDateIndo(it.created_at, "d MMM yyyy, HH:mm")} WIB
                      </span>
                    </div>
                  </div>

                  {/* Pratinjau Foto Bukti Bayar */}
                  <div className="mt-2">
                    <span className="text-[10px] font-semibold text-[#5F7A84] block mb-1">
                      Bukti Transfer:
                    </span>
                    {it.bukti_url ? (
                      <div
                        onClick={() => setZoomUrl(it.bukti_url)}
                        className="relative h-32 w-full rounded-xl overflow-hidden border border-[#E8E8E1] bg-[#FAFAF8] cursor-pointer group"
                      >
                        <Image
                          src={it.bukti_url}
                          alt="Bukti Transfer"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                          <ZoomIn className="h-4 w-4" />
                          <span>Perbesar Foto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-xl bg-[#F8F9FA] border border-dashed border-[#E8E8E1] flex items-center justify-center text-[11px] text-[#5F7A84]">
                        Tidak ada lampiran foto bukti
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi Verifikasi */}
                <div className="pt-2 border-t border-[#E8E8E1] grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedForReject(it);
                      setRejectReason("");
                    }}
                    className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Tolak
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setSelectedForApprove(it)}
                    className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Setujui
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Zoom Bukti Foto */}
      <Dialog open={Boolean(zoomUrl)} onOpenChange={() => setZoomUrl(null)}>
        <DialogContent className="max-w-2xl bg-white p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#234E5C]">
              Pratinjau Foto Bukti Pembayaran
            </DialogTitle>
          </DialogHeader>
          {zoomUrl && (
            <div className="relative w-full h-[70vh] rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
              <Image
                src={zoomUrl}
                alt="Bukti Transfer"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Persetujuan */}
      <Dialog
        open={Boolean(selectedForApprove)}
        onOpenChange={() => !isProcessing && setSelectedForApprove(null)}
      >
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Konfirmasi Persetujuan Pembayaran</span>
            </DialogTitle>
          </DialogHeader>

          {selectedForApprove && (
            <div className="text-xs text-[#234E5C] space-y-3 py-2">
              <p>Apakah Anda yakin ingin menyetujui transaksi pembayaran ini?</p>
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8E8E1] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Kode Booking:</span>
                  <span className="font-bold">#{selectedForApprove.booking?.kode_booking}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Pelanggan:</span>
                  <span className="font-semibold">{selectedForApprove.booking?.profile?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Nominal Uang Masuk:</span>
                  <span className="font-black text-[#A0630F]">{formatRupiah(selectedForApprove.jumlah)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Metode:</span>
                  <span>{selectedForApprove.metode}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#5F7A84]">
                Setelah disetujui, transaksi ini akan berstatus <strong>Terverifikasi</strong> dan bersifat kekal (immutable) pada buku besar.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setSelectedForApprove(null)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleApprove}
              className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold"
            >
              {isProcessing ? "Menyetujui..." : "Ya, Setujui Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tolak Pembayaran Ber-alasan */}
      <Dialog
        open={Boolean(selectedForReject)}
        onOpenChange={() => !isProcessing && setSelectedForReject(null)}
      >
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Tolak Bukti Pembayaran</span>
            </DialogTitle>
          </DialogHeader>

          {selectedForReject && (
            <div className="text-xs text-[#234E5C] space-y-3 py-2">
              <p>
                Sampaikan alasan penolakan secara jelas. Pelanggan dapat melihat alasan ini di halaman pembayaran untuk mengunggah ulang bukti transfer yang benar.
              </p>
              <div className="space-y-1.5">
                <label className="font-bold text-[#234E5C] block">
                  Alasan Penolakan <span className="text-red-500">*</span>:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Nominal transfer kurang Rp 50.000, mutasi rekening tidak ditemukan, atau gambar bukti transfer buram."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-[#E8E8E1] bg-white text-xs text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setSelectedForReject(null)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleReject}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isProcessing ? "Menolak..." : "Tolak Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
