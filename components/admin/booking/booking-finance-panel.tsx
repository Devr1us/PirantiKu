"use client";

import * as React from "react";
import Image from "next/image";
import {
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  ZoomIn,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import {
  calculateBookingFinancials,
  PAYMENT_STATUS_BADGES,
  PAYMENT_JENIS_LABELS,
  type BookingFinancialDetail,
} from "@/lib/finance";
import { compressImage } from "@/lib/payment-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { AdminBookingWithDetails } from "./admin-booking-manager";
import type { Payment } from "@/types/database";

interface BookingFinancePanelProps {
  booking: AdminBookingWithDetails;
  onFinancialUpdate: (updatedPayments: Payment[], updatedStatus?: string) => void;
}

export function BookingFinancePanel({
  booking,
  onFinancialUpdate,
}: BookingFinancePanelProps) {
  const [financials, setFinancials] = React.useState<BookingFinancialDetail>(() =>
    calculateBookingFinancials({
      booking,
      items: booking.items,
      payments: booking.payments,
      returns: booking.returns,
    })
  );

  // Modal Catat Pembayaran Manual
  const [isManualModalOpen, setIsManualModalOpen] = React.useState(false);
  const [manualJenis, setManualJenis] = React.useState<string>("pelunasan");
  const [manualArah, setManualArah] = React.useState<string>("masuk");
  const [manualJumlah, setManualJumlah] = React.useState<number>(0);
  const [manualMetode, setManualMetode] = React.useState<string>("Tunai di Tempat");
  const [manualCatatan, setManualCatatan] = React.useState<string>("");
  const [manualBuktiUrl, setManualBuktiUrl] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Modal Zoom Bukti
  const [zoomUrl, setZoomUrl] = React.useState<string | null>(null);

  // Modal Override Serah Terima Alat
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState("");

  // Sinkronisasi jika booking props berubah
  React.useEffect(() => {
    setFinancials(
      calculateBookingFinancials({
        booking,
        items: booking.items,
        payments: booking.payments,
        returns: booking.returns,
      })
    );
  }, [booking]);

  // Handle upload bukti manual
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.85);
      setManualBuktiUrl(compressed);
      toast.success("Foto bukti bayar berhasil dimuat.");
    } catch {
      toast.error("Gagal memproses file foto.");
    }
  };

  // Submit Pembayaran Manual
  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualJumlah <= 0) {
      toast.error("Nominal pembayaran harus lebih dari Rp 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/finance/manual-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          jenis: manualJenis,
          arah: manualArah,
          jumlah: manualJumlah,
          metode: manualMetode,
          buktiUrl: manualBuktiUrl,
          catatan: manualCatatan,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat pembayaran.");

      toast.success("Transaksi pembayaran berhasil dicatat ke buku besar!");
      setIsManualModalOpen(false);
      setManualJumlah(0);
      setManualCatatan("");
      setManualBuktiUrl(null);

      const updatedPayments = [json.data, ...(booking.payments || [])];
      onFinancialUpdate(updatedPayments);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Override Serah Terima Alat
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      toast.error("Alasan tertulis override wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/finance/override-handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          alasan: overrideReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal melakukan override serah terima.");

      toast.success("Serah terima alat berhasil di-override dan dicatat di log audit!");
      setIsOverrideModalOpen(false);
      setOverrideReason("");
      onFinancialUpdate(booking.payments || [], "diambil");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadgeConfig = PAYMENT_STATUS_BADGES[financials.statusPembayaran];

  return (
    <div className="space-y-5 text-xs text-[#234E5C]">
      {/* 1. Header Finansial & Badge Status */}
      <div className="p-4 rounded-xl bg-white border border-[#E8E8E1] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Status Finansial Booking
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusBadgeConfig.bg} ${statusBadgeConfig.text} ${statusBadgeConfig.border}`}
              >
                <span className={`h-2 w-2 rounded-full ${statusBadgeConfig.dot}`} />
                {statusBadgeConfig.label}
              </span>
              <span className="text-[11px] text-[#5F7A84]">
                {statusBadgeConfig.description}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              // Pre-fill target nominal sisa pelunasan jika belum lunas
              const sisa = Math.max(
                0,
                financials.totalKewajibanAwal - financials.totalMasukTerverifikasi
              );
              setManualJumlah(sisa > 0 ? sisa : 0);
              setManualJenis(sisa > 0 ? "pelunasan" : "penyesuaian");
              setIsManualModalOpen(true);
            }}
            className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold h-8 shrink-0"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Catat Pembayaran Manual
          </Button>
        </div>

        {/* Kotak Rekapitulasi Angka Finansial */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Total Sewa */}
          <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1]">
            <span className="text-[10px] text-[#5F7A84] block font-semibold">Total Biaya Sewa:</span>
            <span className="font-black text-sm text-[#234E5C]">
              {formatRupiah(financials.totalSewa)}
            </span>
            <span className="text-[9px] text-[#5F7A84] block mt-0.5">
              Target DP: {formatRupiah(financials.dpTarget)}
            </span>
          </div>

          {/* Deposit Jaminan */}
          <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1]">
            <span className="text-[10px] text-[#5F7A84] block font-semibold">Uang Deposit:</span>
            <span className="font-black text-sm text-[#A0630F]">
              {formatRupiah(financials.depositTarget)}
            </span>
            <span className="text-[9px] text-[#5F7A84] block mt-0.5">
              Telah Masuk: {formatRupiah(financials.depositTelahDibayar)}
            </span>
          </div>

          {/* Realisasi Uang Masuk */}
          <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1]">
            <span className="text-[10px] text-[#5F7A84] block font-semibold">Uang Masuk Terverifikasi:</span>
            <span className="font-black text-sm text-[#2E5E4E]">
              {formatRupiah(financials.totalMasukTerverifikasi)}
            </span>
            <span className="text-[9px] text-[#5F7A84] block mt-0.5">
              DP: {formatRupiah(financials.dpTelahDibayar)} | Lunas: {formatRupiah(financials.pelunasanTelahDibayar)}
            </span>
          </div>

          {/* Saldo Bersih */}
          <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1]">
            <span className="text-[10px] text-[#5F7A84] block font-semibold">Saldo Bersih Booking:</span>
            <span
              className={`font-black text-sm ${
                financials.saldoBersih === 0
                  ? "text-[#2E5E4E]"
                  : financials.saldoBersih > 0
                  ? "text-[#0369A1]"
                  : "text-[#991B1B]"
              }`}
            >
              {formatRupiah(financials.saldoBersih)}
            </span>
            <span className="text-[9px] text-[#5F7A84] block mt-0.5">
              {financials.saldoBersih === 0
                ? "Lunas & Tuntas (Rp 0)"
                : financials.saldoBersih > 0
                ? "Kelebihan / Perlu Refund"
                : "Kekurangan Bayar"}
            </span>
          </div>
        </div>

        {/* Peringatan Serah Terima Alat jika belum lunas */}
        {!financials.isLunasSebelumAmbil && booking.status === "dp_dibayar" && (
          <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#D97706] shrink-0" />
              <div>
                <p className="font-bold text-[11px]">
                  Pelunasan sewa dan uang deposit belum terpenuhi 100%!
                </p>
                <p className="text-[10px] text-[#92400E]">
                  SOP: Alat tidak boleh diserahkan sebelum tagihan awal lunas, kecuali admin memberi persetujuan khusus (override).
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOverrideModalOpen(true)}
              className="text-[11px] h-7 border-[#D97706] text-[#78350F] hover:bg-[#FDE68A] font-bold shrink-0"
            >
              Override Serah Terima
            </Button>
          </div>
        )}
      </div>

      {/* 2. Timeline Riwayat Transaksi Buku Besar */}
      <div className="p-4 rounded-xl bg-white border border-[#E8E8E1] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
            Riwayat Pembayaran & Transaksi ({booking.payments?.length || 0})
          </span>
        </div>

        {(!booking.payments || booking.payments.length === 0) ? (
          <div className="p-6 text-center text-xs text-[#5F7A84]">
            Belum ada transaksi pembayaran yang tercatat untuk booking ini.
          </div>
        ) : (
          <div className="space-y-2">
            {booking.payments.map((p) => {
              const isMasuk = p.arah === "masuk" || (p.jenis !== "refund_deposit" && !p.arah);
              const labelJenis =
                PAYMENT_JENIS_LABELS[p.jenis as keyof typeof PAYMENT_JENIS_LABELS] || p.jenis;
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isMasuk ? "bg-[#E2F0D9] text-[#2E5E4E]" : "bg-[#FEE2E2] text-[#991B1B]"
                      }`}
                    >
                      {isMasuk ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#234E5C]">{labelJenis}</span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                            p.status === "terverifikasi"
                              ? "bg-[#E2F0D9] text-[#2E5E4E]"
                              : p.status === "menunggu_verifikasi"
                              ? "bg-[#FEF3C7] text-[#78350F]"
                              : "bg-[#FEE2E2] text-[#991B1B]"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F7A84]">
                        Metode: <strong>{p.metode}</strong> | Waktu: {formatDateIndo(p.created_at || p.dibayar_pada, "d MMM yyyy, HH:mm")} WIB
                      </p>
                      {p.catatan && (
                        <p className="text-[10px] text-[#5F7A84] italic">&quot;{p.catatan}&quot;</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span
                      className={`font-black text-sm ${
                        isMasuk ? "text-[#234E5C]" : "text-[#991B1B]"
                      }`}
                    >
                      {isMasuk ? "+" : "-"} {formatRupiah(p.jumlah)}
                    </span>

                    {p.bukti_url && (
                      <button
                        type="button"
                        onClick={() => setZoomUrl(p.bukti_url)}
                        className="text-[10px] text-[#A0630F] font-bold underline hover:text-[#234E5C] flex items-center gap-0.5 cursor-pointer"
                      >
                        <ZoomIn className="h-3 w-3" />
                        Bukti
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Catat Pembayaran Manual */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#A0630F]" />
              <span>Input Pembayaran Manual (Di Tempat)</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitManualPayment} className="space-y-4 pt-2 text-xs">
            {/* Pilihan Jenis */}
            <div className="space-y-1.5">
              <Label className="font-bold">Jenis Pembayaran</Label>
              <select
                value={manualJenis}
                onChange={(e) => setManualJenis(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C]"
              >
                <option value="pelunasan">Pelunasan Sewa</option>
                <option value="deposit">Uang Jaminan (Deposit)</option>
                <option value="dp">Uang Muka (DP)</option>
                <option value="denda">Denda Keterlambatan</option>
                <option value="ganti_rugi">Ganti Rugi Kerusakan</option>
                <option value="penyesuaian">Koreksi / Penyesuaian</option>
              </select>
            </div>

            {/* Arah Transaksi */}
            <div className="space-y-1.5">
              <Label className="font-bold">Arah Arus Kas</Label>
              <select
                value={manualArah}
                onChange={(e) => setManualArah(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C]"
              >
                <option value="masuk">Uang Masuk (Pemasukan Toko)</option>
                <option value="keluar">Uang Keluar (Pengeluaran Toko)</option>
              </select>
            </div>

            {/* Nominal */}
            <div className="space-y-1.5">
              <Label className="font-bold">
                Nominal (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                value={manualJumlah}
                onChange={(e) => setManualJumlah(Number(e.target.value))}
                required
                className="text-xs bg-white h-9"
              />
            </div>

            {/* Metode */}
            <div className="space-y-1.5">
              <Label className="font-bold">Metode Pembayaran</Label>
              <Input
                type="text"
                value={manualMetode}
                onChange={(e) => setManualMetode(e.target.value)}
                placeholder="Contoh: Tunai di Tempat, Transfer Kasir"
                required
                className="text-xs bg-white h-9"
              />
            </div>

            {/* Upload Bukti */}
            <div className="space-y-1.5">
              <Label className="font-bold">Lampiran Bukti (Opsional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs bg-white"
              />
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <Label className="font-bold">Catatan Pembukuan</Label>
              <textarea
                value={manualCatatan}
                onChange={(e) => setManualCatatan(e.target.value)}
                rows={2}
                placeholder="Keterangan tambahan transaksi..."
                className="w-full p-2.5 rounded-xl border border-[#E8E8E1] bg-white text-xs text-[#234E5C]"
              />
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setIsManualModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pembayaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Override Serah Terima Alat */}
      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#991B1B] flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#D97706]" />
              <span>Override Serah Terima Alat</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitOverride} className="space-y-4 pt-2 text-xs">
            <p className="text-xs text-[#5F7A84] leading-relaxed">
              Anda akan menyerahkan unit fisik sebelum pelunasan dan uang deposit lunas 100%. Sesuai kebijakan keamanan, tindakan ini wajib disertai <strong>alasan tertulis</strong> yang akan disimpan di log audit admin.
            </p>

            <div className="space-y-1.5">
              <Label className="font-bold">
                Alasan Tertulis Override <span className="text-red-500">*</span>:
              </Label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="Contoh: Pelanggan langganan instansi resmi, pembayaran dijanjikan tunai saat selesai..."
                required
                className="w-full p-2.5 rounded-xl border border-[#FECACA] bg-white text-xs text-[#234E5C]"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-[#D97706] hover:bg-[#B45309] text-white font-bold"
              >
                {isSubmitting ? "Menyimpan..." : "Konfirmasi Override Serah Terima"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <Image src={zoomUrl} alt="Bukti" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
