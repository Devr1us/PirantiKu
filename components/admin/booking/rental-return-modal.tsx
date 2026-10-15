"use client";

import * as React from "react";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  DollarSign,
  Upload,
  X,
  ShieldCheck,
  Package,
  Wrench,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { compressImage } from "@/lib/payment-utils";
import type {
  Booking,
  BookingItem,
  EquipmentItem,
  DamageJenis,
} from "@/types/database";

export interface ReturnInspectionItemState {
  bookingItemId: number;
  equipmentNama: string;
  maxQty: number;
  condition: "baik" | "rusak_ringan" | "rusak_berat" | "hilang";
  damageQty: number;
  deskripsi: string;
  biayaGantiRugi: number;
  fotoUrl?: string;
}

interface RentalReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    kode_booking: string;
    status: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    total_harga: number;
    deposit: number;
    dp_jumlah: number;
    items?: (BookingItem & { equipment?: EquipmentItem | null })[];
    profile?: {
      nama?: string;
      no_hp?: string;
    } | null;
  };
  dendaPerHari?: number;
  onSuccess: () => void;
}

export function RentalReturnModal({
  isOpen,
  onClose,
  booking,
  dendaPerHari = 50000,
  onSuccess,
}: RentalReturnModalProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 1. Perhitungan Keterlambatan Otomatis
  const returnDate = React.useMemo(() => new Date(), []);
  const scheduledEndDate = React.useMemo(
    () => new Date(booking.tanggal_selesai + "T23:59:59"),
    [booking.tanggal_selesai]
  );

  const calculatedLateDays = React.useMemo(() => {
    if (returnDate.getTime() <= scheduledEndDate.getTime()) return 0;
    const diffMs = returnDate.getTime() - scheduledEndDate.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [returnDate, scheduledEndDate]);

  const [lateDays, setLateDays] = React.useState<number>(calculatedLateDays);
  const [lateFee, setLateFee] = React.useState<number>(calculatedLateDays * dendaPerHari);
  const [returnNotes, setReturnNotes] = React.useState<string>("");

  // 2. State Kondisi Item per Item
  const [itemsInspection, setItemsInspection] = React.useState<ReturnInspectionItemState[]>(
    () =>
      booking.items?.map((it) => ({
        bookingItemId: it.id,
        equipmentNama: it.equipment?.nama || "Alat Rental",
        maxQty: it.qty,
        condition: "baik",
        damageQty: 1,
        deskripsi: "",
        biayaGantiRugi: 0,
      })) || []
  );

  // Sync state if booking items change
  React.useEffect(() => {
    if (booking.items) {
      setItemsInspection(
        booking.items.map((it) => ({
          bookingItemId: it.id,
          equipmentNama: it.equipment?.nama || "Alat Rental",
          maxQty: it.qty,
          condition: "baik",
          damageQty: 1,
          deskripsi: "",
          biayaGantiRugi: 0,
        }))
      );
    }
    setLateDays(calculatedLateDays);
    setLateFee(calculatedLateDays * dendaPerHari);
  }, [booking, calculatedLateDays, dendaPerHari]);

  // Update item condition
  const handleUpdateItem = (
    index: number,
    patch: Partial<ReturnInspectionItemState>
  ) => {
    setItemsInspection((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  // Upload foto kerusakan
  const handlePhotoUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.82);
      handleUpdateItem(index, { fotoUrl: compressed });
      toast.success("Foto bukti kerusakan berhasil dimuat.");
    } catch {
      toast.error("Gagal memproses gambar bukti kerusakan.");
    }
  };

  // 3. Kalkulasi Finansial
  const totalGantiRugi = React.useMemo(() => {
    return itemsInspection.reduce((sum, item) => {
      if (item.condition !== "baik") {
        return sum + (item.biayaGantiRugi || 0);
      }
      return sum;
    }, 0);
  }, [itemsInspection]);

  // Deposit Dikembalikan = Deposit Awal - Denda - Ganti Rugi
  const netRefund = booking.deposit - lateFee - totalGantiRugi;

  // Eksekusi Simpan Pengembalian
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const damagedReportsToSave = itemsInspection
        .filter((it) => it.condition !== "baik")
        .map((it) => ({
          booking_item_id: it.bookingItemId,
          jenis: it.condition as DamageJenis,
          jumlah: Math.min(it.maxQty, Math.max(1, it.damageQty)),
          deskripsi: it.deskripsi.trim() || `Unit dinyatakan ${it.condition.replace("_", " ")}`,
          biaya_ganti_rugi: it.biayaGantiRugi || 0,
          foto_url: it.fotoUrl || null,
        }));

      // 1. Coba panggil RPC `terima_pengembalian` jika didukung oleh database
      let returnId: number | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          "terima_pengembalian",
          {
            p_booking_id: booking.id,
            p_tanggal: new Date().toISOString(),
            p_catatan: returnNotes.trim() || null,
            p_kerusakan: damagedReportsToSave,
          }
        );

        if (!rpcErr && rpcData) {
          returnId = Number(rpcData);
          // Update rincian finansial pada record return yang dibuat oleh RPC
          await supabase
            .from("booking_returns")
            .update({
              hari_terlambat: lateDays,
              denda_terlambat: lateFee,
              total_ganti_rugi: totalGantiRugi,
              deposit_dikembalikan: Math.max(0, netRefund),
            })
            .eq("id", returnId);
        }
      } catch {
        // Fallback ke direct database insert
      }

      // 2. Jika RPC tidak dijalankan, lakukan Fallback Direct Insert
      if (!returnId) {
        const { data: retRow, error: retErr } = await supabase
          .from("booking_returns")
          .insert({
            booking_id: booking.id,
            tanggal_dikembalikan: new Date().toISOString(),
            hari_terlambat: lateDays,
            denda_terlambat: lateFee,
            total_ganti_rugi: totalGantiRugi,
            deposit_dikembalikan: Math.max(0, netRefund),
            catatan: returnNotes.trim() || null,
          })
          .select("id")
          .single();

        if (retErr) throw retErr;
        returnId = retRow.id;

        // Simpan setiap damage report jika ada
        if (damagedReportsToSave.length > 0) {
          const damageInserts = damagedReportsToSave.map((dm) => ({
            ...dm,
            return_id: returnId!,
          }));

          await supabase.from("damage_reports").insert(damageInserts);
        }
      }

      // 3. Update status booking menjadi "selesai" (atau "bermasalah" jika ada kekurangan bayar besar)
      const finalBookingStatus = netRefund < 0 ? "bermasalah" : "selesai";
      await supabase
        .from("bookings")
        .update({
          status: finalBookingStatus,
          pesan_admin: `Unit telah dikembalikan pada ${formatDateIndo(
            new Date().toISOString(),
            "d MMM yyyy, HH:mm"
          )} WIB. Deposit diselesaikan: ${formatRupiah(Math.max(0, netRefund))}.`,
        })
        .eq("id", booking.id);

      // 3. Catat payment refund jika ada sisa deposit yang dikembalikan
      if (netRefund > 0) {
        try {
          await supabase.from("payments").insert({
            booking_id: booking.id,
            jenis: "refund_deposit",
            jumlah: netRefund,
            metode: "Pengembalian Deposit (Tunai/Transfer)",
            status: "terverifikasi",
            dibayar_pada: new Date().toISOString(),
          });
        } catch {
          // optional
        }
      }

      // 4. Catat status history
      try {
        await supabase.from("booking_status_history").insert({
          booking_id: booking.id,
          status_lama: booking.status as any,
          status_baru: "selesai",
        });
      } catch {
        // optional
      }

      toast.success(
        `Pengembalian booking #${booking.kode_booking} berhasil diproses & diselesaikan!`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Gagal memproses pengembalian:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
      toast.error(`Gagal memproses pengembalian: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
            <div>
              <DialogTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-[#A0630F]" />
                <span>Inspeksi Pengembalian Unit & Pencairan Deposit</span>
              </DialogTitle>
              <p className="text-xs text-[#5F7A84] mt-0.5">
                Kode Booking: <strong className="text-[#234E5C]">#{booking.kode_booking}</strong> |
                Penyewa: <strong className="text-[#234E5C]">{booking.profile?.nama || "Penyewa"}</strong>
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmitReturn} className="space-y-6 pt-3 text-xs text-[#234E5C]">
          {/* 1. SEKSI KETERLAMBATAN WAKTU */}
          <div className="p-4 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5 text-[11px]">
                <Clock className="h-3.5 w-3.5 text-[#234E5C]" />
                Pemeriksaan Batas Waktu Sewa
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  lateDays > 0
                    ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
                    : "bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]"
                }`}
              >
                {lateDays > 0 ? `Terlambat ${lateDays} Hari` : "Tepat Waktu (On Time)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[#5F7A84] block text-[11px]">Batas Waktu Tertera:</span>
                <p className="font-bold text-[#234E5C]">
                  {formatDateIndo(booking.tanggal_selesai, "d MMMM yyyy")}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#5F7A84] block text-[11px]">Tanggal Pengembalian Fisik:</span>
                <p className="font-bold text-[#234E5C]">
                  {formatDateIndo(returnDate.toISOString(), "d MMMM yyyy, HH:mm")} WIB
                </p>
              </div>
            </div>

            {lateDays > 0 && (
              <div className="p-3 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#A0630F]" />
                    Denda Keterlambatan Dihitung:
                  </span>
                  <p className="text-[11px]">
                    {lateDays} hari terlambat &times; {formatRupiah(dendaPerHari)}/hari
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-bold">Total Denda (Rp):</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={lateFee}
                    onChange={(e) => setLateFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="h-8 w-32 bg-white text-xs font-bold text-[#991B1B]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. SEKSI CEK KONDISI FISIK PER UNIT ALAT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-2">
              <span className="font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5 text-[11px]">
                <Wrench className="h-3.5 w-3.5 text-[#234E5C]" />
                Inspeksi Kelayakan Fisik Peralatan ({itemsInspection.length})
              </span>
              <span className="text-[11px] text-[#5F7A84]">
                Pilih kondisi setiap alat yang dikembalikan
              </span>
            </div>

            <div className="space-y-3">
              {itemsInspection.map((item, idx) => {
                const isDamaged = item.condition !== "baik";
                return (
                  <div
                    key={item.bookingItemId}
                    className={`p-4 rounded-xl border transition-all ${
                      isDamaged
                        ? "border-[#FDE68A] bg-[#FEF3C7]/20 space-y-3"
                        : "border-[#E8E8E1] bg-white space-y-2"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#234E5C] shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-[#234E5C] block">
                            {item.equipmentNama}
                          </span>
                          <span className="text-[11px] text-[#5F7A84]">
                            Jumlah disewa: <strong>{item.maxQty} unit</strong>
                          </span>
                        </div>
                      </div>

                      {/* Pill Pilihan Kondisi */}
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            { key: "baik", label: "Kondisi Baik", color: "bg-[#E2F0D9] text-[#2E5E4E]" },
                            { key: "rusak_ringan", label: "Rusak Ringan", color: "bg-[#FEF3C7] text-[#A0630F]" },
                            { key: "rusak_berat", label: "Rusak Berat", color: "bg-[#FEE2E2] text-[#991B1B]" },
                            { key: "hilang", label: "Hilang", color: "bg-black text-white" },
                          ] as const
                        ).map((cond) => {
                          const isSel = item.condition === cond.key;
                          return (
                            <button
                              key={cond.key}
                              type="button"
                              onClick={() =>
                                handleUpdateItem(idx, {
                                  condition: cond.key,
                                  biayaGantiRugi: cond.key === "baik" ? 0 : item.biayaGantiRugi || 50000,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                isSel
                                  ? `${cond.color} border-current shadow-xs`
                                  : "bg-white text-[#5F7A84] border-[#E8E8E1] hover:bg-[#FAFAF8]"
                              }`}
                            >
                              {cond.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Form Rincian Kerusakan jika Rusak/Hilang */}
                    {isDamaged && (
                      <div className="pt-2 border-t border-[#FDE68A] grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg border">
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[10px] font-bold text-[#78350F]">
                            Qty Rusak/Hilang:
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={item.maxQty}
                            value={item.damageQty}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                damageQty: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="h-8 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[10px] font-bold text-[#78350F]">
                            Deskripsi Kerusakan:
                          </Label>
                          <Input
                            placeholder="Contoh: Gagang patah / lensa tergores..."
                            value={item.deskripsi}
                            onChange={(e) =>
                              handleUpdateItem(idx, { deskripsi: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[10px] font-bold text-[#78350F]">
                            Biaya Ganti Rugi (Rp):
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={10000}
                            value={item.biayaGantiRugi}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                biayaGantiRugi: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="h-8 text-xs font-bold text-[#991B1B]"
                          />
                        </div>

                        {/* Opsi Foto Bukti Kerusakan */}
                        <div className="sm:col-span-12 flex items-center justify-between pt-1">
                          {item.fotoUrl ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-[#2E5E4E] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Foto bukti kerusakan terlampir
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(idx, { fotoUrl: undefined })}
                                className="text-[10px] text-[#991B1B] hover:underline"
                              >
                                Hapus foto
                              </button>
                            </div>
                          ) : (
                            <label className="inline-flex items-center gap-1 text-[10px] font-bold text-[#A0630F] hover:underline cursor-pointer">
                              <Upload className="h-3 w-3" />
                              <span>Lampirkan Foto Bukti Kerusakan (Opsional)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(idx, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. KALKULASI PENYELESAIAN DEPOSIT */}
          <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-5 space-y-4">
            <span className="font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5 text-[11px] border-b border-[#E8E8E1] pb-2">
              <DollarSign className="h-3.5 w-3.5 text-[#234E5C]" />
              Kalkulasi Penyelesaian Uang Jaminan (Deposit)
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#5F7A84]">
                <span>Uang Jaminan (Deposit) Awal:</span>
                <span className="font-bold text-[#234E5C]">
                  + {formatRupiah(booking.deposit)}
                </span>
              </div>

              {lateFee > 0 && (
                <div className="flex justify-between text-[#991B1B]">
                  <span>Potongan Denda Terlambat ({lateDays} hari):</span>
                  <span className="font-bold">- {formatRupiah(lateFee)}</span>
                </div>
              )}

              {totalGantiRugi > 0 && (
                <div className="flex justify-between text-[#991B1B]">
                  <span>Potongan Ganti Rugi Kerusakan:</span>
                  <span className="font-bold">- {formatRupiah(totalGantiRugi)}</span>
                </div>
              )}

              {/* Hasil Akhir Deposit */}
              <div
                className={`p-3.5 rounded-xl border mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  netRefund >= 0
                    ? "bg-[#E2F0D9] border-[#C5E1A5] text-[#2E5E4E]"
                    : "bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]"
                }`}
              >
                <div>
                  <span className="font-extrabold text-sm block">
                    {netRefund >= 0
                      ? "Deposit yang Dikembalikan ke Penyewa:"
                      : "Deposit Habis! Penyewa Kurang Bayar Sebesar:"}
                  </span>
                  <span className="text-[11px] opacity-90">
                    {netRefund >= 0
                      ? "Kembalikan dana deposit ini secara tunai atau transfer ke penyewa."
                      : "Biaya denda & kerusakan melebihi deposit awal. Tagih kekurangan ke penyewa."}
                  </span>
                </div>

                <span className="text-xl font-extrabold shrink-0 self-start sm:self-auto">
                  {formatRupiah(Math.abs(netRefund))}
                </span>
              </div>
            </div>
          </div>

          {/* 4. CATATAN PENGEMBALIAN */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#234E5C]">
              Catatan Pengembalian & Kondisi Akhir (Opsional)
            </Label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Contoh: Seluruh unit telah diterima lengkap dan bersih. Uang deposit telah ditransfer balik..."
              className="w-full rounded-xl border border-[#E8E8E1] bg-white p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
            />
          </div>

          {/* TOMBOL AKSI SUBMIT */}
          <div className="border-t border-[#E8E8E1] pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs text-[#5F7A84]"
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="warm"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-bold gap-2 px-6 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Memproses..." : "Selesaikan Pengembalian & Simpan"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RentalReturnModal;
