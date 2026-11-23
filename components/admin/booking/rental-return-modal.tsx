"use client";

import * as React from "react";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Upload,
  Package,
  Wrench,
  HelpCircle,
  AlertCircle,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { compressImage } from "@/lib/payment-utils";
import { calculateDamageCost } from "@/lib/finance";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type {
  BookingItem,
  EquipmentItem,
} from "@/types/database";

export interface ReturnInspectionItemState {
  bookingItemId: number;
  equipmentId: number;
  equipmentNama: string;
  nilaiGanti: number;
  hargaPerHari: number;
  isFallbackNilaiGanti: boolean;
  maxQty: number;
  condition: "baik" | "rusak_ringan" | "rusak_berat" | "hilang";
  damageQty: number;
  deskripsi: string;
  biayaOtomatis: number;
  biayaGantiRugi: number;
  biayaOverride?: number | null;
  alasanOverride?: string;
  formulaText?: string;
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
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  // Settings persentase tarif ganti rugi
  const [settingsTarif, setSettingsTarif] = React.useState({
    persenRingan: DEFAULT_SETTINGS.persen_rusak_ringan,
    persenBerat: DEFAULT_SETTINGS.persen_rusak_berat,
    persenHilang: DEFAULT_SETTINGS.persen_hilang,
    faktorNilaiGanti: DEFAULT_SETTINGS.faktor_nilai_ganti,
  });

  // Muat settings dinamis dari database jika tersedia
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from("settings").select("key, value");
        if (data && data.length > 0) {
          const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
          setSettingsTarif({
            persenRingan: parseInt(map.persen_rusak_ringan, 10) || DEFAULT_SETTINGS.persen_rusak_ringan,
            persenBerat: parseInt(map.persen_rusak_berat, 10) || DEFAULT_SETTINGS.persen_rusak_berat,
            persenHilang: parseInt(map.persen_hilang, 10) || DEFAULT_SETTINGS.persen_hilang,
            faktorNilaiGanti: parseInt(map.faktor_nilai_ganti, 10) || DEFAULT_SETTINGS.faktor_nilai_ganti,
          });
        }
      } catch {
        // Fallback default
      }
    }
    loadSettings();
  }, [supabase]);

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

  const defaultCalculatedLateFee = calculatedLateDays * dendaPerHari;
  const [lateDays, setLateDays] = React.useState<number>(calculatedLateDays);
  const [lateFee, setLateFee] = React.useState<number>(defaultCalculatedLateFee);
  const [dendaOverrideAlasan, setDendaOverrideAlasan] = React.useState<string>("");
  const [returnNotes, setReturnNotes] = React.useState<string>("");

  // Helper pembuat state awal item inspeksi
  const createInitialItems = React.useCallback((): ReturnInspectionItemState[] => {
    return (
      booking.items?.map((it) => {
        const hargaPerHari = Number(it.equipment?.harga_per_hari) || 0;
        const nilaiGantiRaw = Number(it.equipment?.nilai_ganti);
        const isFallbackNilaiGanti = !nilaiGantiRaw || nilaiGantiRaw <= 0;
        const baseValue = isFallbackNilaiGanti
          ? hargaPerHari * settingsTarif.faktorNilaiGanti
          : nilaiGantiRaw;

        return {
          bookingItemId: it.id,
          equipmentId: it.equipment_id,
          equipmentNama: it.equipment?.nama || "Alat Rental",
          nilaiGanti: baseValue,
          hargaPerHari,
          isFallbackNilaiGanti,
          maxQty: it.qty,
          condition: "baik" as const,
          damageQty: 1,
          deskripsi: "",
          biayaOtomatis: 0,
          biayaGantiRugi: 0,
          biayaOverride: null,
          alasanOverride: "",
          formulaText: "Kondisi Baik - Tanpa Ganti Rugi",
        };
      }) || []
    );
  }, [booking.items, settingsTarif.faktorNilaiGanti]);

  const [itemsInspection, setItemsInspection] = React.useState<ReturnInspectionItemState[]>(createInitialItems);

  // Sync state if booking items change
  const [prevSyncKey, setPrevSyncKey] = React.useState(booking.id);
  if (prevSyncKey !== booking.id) {
    setPrevSyncKey(booking.id);
    setItemsInspection(createInitialItems());
    setLateDays(calculatedLateDays);
    setLateFee(defaultCalculatedLateFee);
    setDendaOverrideAlasan("");
  }

  // Update item condition & hitung ulang otomatis berdasarkan tarif
  const handleUpdateItemCondition = (
    index: number,
    condition: "baik" | "rusak_ringan" | "rusak_berat" | "hilang"
  ) => {
    setItemsInspection((prev) => {
      const copy = [...prev];
      const item = copy[index];

      const calc = calculateDamageCost({
        condition,
        qty: item.damageQty,
        nilaiGanti: item.nilaiGanti,
        hargaPerHari: item.hargaPerHari,
        persenRingan: settingsTarif.persenRingan,
        persenBerat: settingsTarif.persenBerat,
        persenHilang: settingsTarif.persenHilang,
        faktorNilaiGanti: settingsTarif.faktorNilaiGanti,
      });

      copy[index] = {
        ...item,
        condition,
        biayaOtomatis: calc.biayaOtomatis,
        biayaGantiRugi: calc.biayaOtomatis,
        biayaOverride: null,
        alasanOverride: "",
        formulaText: calc.formulaText,
      };
      return copy;
    });
  };

  // Update jumlah qty unit rusak
  const handleUpdateItemQty = (index: number, newQty: number) => {
    setItemsInspection((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const validQty = Math.max(1, Math.min(item.maxQty, newQty));

      const calc = calculateDamageCost({
        condition: item.condition,
        qty: validQty,
        nilaiGanti: item.nilaiGanti,
        hargaPerHari: item.hargaPerHari,
        persenRingan: settingsTarif.persenRingan,
        persenBerat: settingsTarif.persenBerat,
        persenHilang: settingsTarif.persenHilang,
        faktorNilaiGanti: settingsTarif.faktorNilaiGanti,
      });

      copy[index] = {
        ...item,
        damageQty: validQty,
        biayaOtomatis: calc.biayaOtomatis,
        biayaGantiRugi: item.biayaOverride !== null && item.biayaOverride !== undefined
          ? item.biayaOverride
          : calc.biayaOtomatis,
        formulaText: calc.formulaText,
      };
      return copy;
    });
  };

  // Update override manual biaya ganti rugi
  const handleUpdateItemBiaya = (index: number, manualCost: number) => {
    setItemsInspection((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const isOverridden = manualCost !== item.biayaOtomatis;

      copy[index] = {
        ...item,
        biayaGantiRugi: manualCost,
        biayaOverride: isOverridden ? manualCost : null,
        alasanOverride: isOverridden ? item.alasanOverride || "" : "",
      };
      return copy;
    });
  };

  // Update patch umum
  const handleUpdateItemPatch = (
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
      handleUpdateItemPatch(index, { fotoUrl: compressed });
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

  const totalKewajiban = lateFee + totalGantiRugi;
  const depositAwal = Number(booking.deposit) || 0;
  const netRefund = depositAwal - totalKewajiban;

  // Alokasi potongan deposit
  const potonganDenda = Math.min(depositAwal, lateFee);
  const sisaDepositSetelahDenda = depositAwal - potonganDenda;
  const potonganGantiRugi = Math.min(sisaDepositSetelahDenda, totalGantiRugi);
  const sisaRefundDeposit = Math.max(0, netRefund);
  const kekuranganBayar = Math.max(0, -netRefund);

  // Validasi sebelum membuka modal konfirmasi
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Denda Override
    const isDendaOverridden = lateFee !== defaultCalculatedLateFee;
    if (isDendaOverridden && !dendaOverrideAlasan.trim()) {
      toast.error("Mohon isi alasan penyesuaian nominal denda keterlambatan.");
      return;
    }

    // 2. Validasi Override Kerusakan
    for (const item of itemsInspection) {
      if (item.condition !== "baik") {
        if (item.damageQty > item.maxQty) {
          toast.error(`Jumlah unit rusak untuk ${item.equipmentNama} melebihi jumlah booking (${item.maxQty} unit).`);
          return;
        }
        if (
          item.biayaOverride !== null &&
          item.biayaOverride !== undefined &&
          item.biayaOverride !== item.biayaOtomatis &&
          !item.alasanOverride?.trim()
        ) {
          toast.error(`Mohon isi alasan penyesuaian biaya ganti rugi untuk alat: ${item.equipmentNama}.`);
          return;
        }
      }
    }

    setIsConfirmOpen(true);
  };

  // Eksekusi Simpan Pengembalian via API Server
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      const damagedReportsToSave = itemsInspection
        .filter((it) => it.condition !== "baik")
        .map((it) => ({
          bookingItemId: it.bookingItemId,
          equipmentId: it.equipmentId,
          condition: it.condition,
          damageQty: it.damageQty,
          deskripsi: it.deskripsi.trim() || `Unit dinyatakan ${it.condition.replace("_", " ")}`,
          biayaGantiRugi: it.biayaGantiRugi,
          biayaOtomatis: it.biayaOtomatis,
          biayaOverride: it.biayaOverride || null,
          alasanOverride: it.alasanOverride?.trim() || null,
          fotoUrl: it.fotoUrl || null,
        }));

      const res = await fetch("/api/admin/booking/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          lateDays,
          lateFee,
          dendaOverrideAlasan: dendaOverrideAlasan.trim() || undefined,
          returnNotes: returnNotes.trim() || undefined,
          damagedReports: damagedReportsToSave,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memproses pengembalian unit.");
      }

      toast.success(
        `Pengembalian booking #${booking.kode_booking} berhasil diproses dan dicatat ke buku besar keuangan!`
      );
      setIsConfirmOpen(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pengembalian.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#234E5C] flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[#234E5C]" />
              <span>Inspeksi Pengembalian Unit &amp; Pencairan Deposit</span>
            </DialogTitle>
            <p className="text-xs text-[#5F7A84]">
              Booking <strong>#{booking.kode_booking}</strong> &bull; Pelanggan: {booking.profile?.nama || "Penyewa"}
            </p>
          </DialogHeader>

          <form onSubmit={handleOpenConfirm} className="space-y-6 pt-2">
            {/* 1. SEKSI KETERLAMBATAN */}
            <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-2">
                <span className="font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-1.5 text-[11px]">
                  <Clock className="h-3.5 w-3.5 text-[#234E5C]" />
                  Jadwal &amp; Keterlambatan Pengembalian
                </span>
                <span className="text-[11px] text-[#5F7A84]">
                  Batas Sewa: {formatDateIndo(booking.tanggal_selesai, "d MMM yyyy")} (21.00 WIB)
                </span>
              </div>

              {lateDays === 0 ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2E5E4E] bg-[#E2F0D9] p-2.5 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Pengembalian Tepat Waktu (Tidak Ada Denda Keterlambatan)</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#991B1B]">
                    <div>
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Terlambat {lateDays} Hari
                      </span>
                      <p className="text-[11px]">
                        Tarif standar: {lateDays} hari terlambat &times; {formatRupiah(dendaPerHari)}/hari = {formatRupiah(defaultCalculatedLateFee)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] font-bold">Total Denda (Rp):</Label>
                      <Input
                        type="number"
                        min={0}
                        step={5000}
                        value={lateFee}
                        onChange={(e) => setLateFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="h-8 w-32 bg-white text-xs font-bold text-[#991B1B]"
                      />
                    </div>
                  </div>

                  {lateFee !== defaultCalculatedLateFee && (
                    <div className="space-y-1 bg-[#FEF3C7] p-2.5 rounded-lg border border-[#FDE68A]">
                      <Label className="text-[10px] font-bold text-[#78350F] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Alasan Penyesuaian Denda Keterlambatan (Wajib Diisi):
                      </Label>
                      <Input
                        placeholder="Contoh: Keringanan keterlambatan karena kondisi darurat..."
                        value={dendaOverrideAlasan}
                        onChange={(e) => setDendaOverrideAlasan(e.target.value)}
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                  )}
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
                  Pilih kondisi: Ringan ({settingsTarif.persenRingan}%), Berat ({settingsTarif.persenBerat}%), Hilang ({settingsTarif.persenHilang}%)
                </span>
              </div>

              <div className="space-y-3">
                {itemsInspection.map((item, idx) => {
                  const isDamaged = item.condition !== "baik";
                  const isCostOverridden =
                    isDamaged &&
                    item.biayaOverride !== null &&
                    item.biayaOverride !== undefined &&
                    item.biayaOverride !== item.biayaOtomatis;

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
                              Jumlah dibooking: <strong>{item.maxQty} unit</strong> &bull; Nilai Ganti:{" "}
                              <strong>{formatRupiah(item.nilaiGanti)}</strong>
                              {item.isFallbackNilaiGanti && (
                                <span className="text-[#A0630F] font-semibold ml-1">
                                  (Fallback {settingsTarif.faktorNilaiGanti}x sewa)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Pill Pilihan Kondisi */}
                        <div className="flex flex-wrap gap-1">
                          {(
                            [
                              { key: "baik", label: "Kondisi Baik", color: "bg-[#E2F0D9] text-[#2E5E4E]" },
                              { key: "rusak_ringan", label: `Rusak Ringan (${settingsTarif.persenRingan}%)`, color: "bg-[#FEF3C7] text-[#A0630F]" },
                              { key: "rusak_berat", label: `Rusak Berat (${settingsTarif.persenBerat}%)`, color: "bg-[#FEE2E2] text-[#991B1B]" },
                              { key: "hilang", label: `Hilang (${settingsTarif.persenHilang}%)`, color: "bg-black text-white" },
                            ] as const
                          ).map((cond) => {
                            const isSel = item.condition === cond.key;
                            return (
                              <button
                                key={cond.key}
                                type="button"
                                onClick={() => handleUpdateItemCondition(idx, cond.key)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
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
                        <div className="pt-2 border-t border-[#FDE68A] space-y-3 bg-white p-3.5 rounded-lg border">
                          {/* Banner Rumus Hitungan Otomatis */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-md bg-[#F3F3EF] border border-[#E8E8E1] text-[11px]">
                            <span className="font-semibold text-[#234E5C] flex items-center gap-1">
                              <HelpCircle className="h-3.5 w-3.5 text-[#5F7A84]" />
                              Rumus Tarif Otomatis:
                            </span>
                            <span className="font-mono text-[#A0630F] font-bold">
                              {item.formulaText}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                            <div className="sm:col-span-3 space-y-1">
                              <Label className="text-[10px] font-bold text-[#78350F]">
                                Qty Rusak / Hilang:
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={item.maxQty}
                                value={item.damageQty}
                                onChange={(e) =>
                                  handleUpdateItemQty(idx, parseInt(e.target.value, 10) || 1)
                                }
                                className="h-8 text-xs font-bold"
                              />
                              <span className="text-[9px] text-[#5F7A84]">Maks {item.maxQty} unit</span>
                            </div>

                            <div className="sm:col-span-5 space-y-1">
                              <Label className="text-[10px] font-bold text-[#78350F]">
                                Deskripsi Kerusakan Fisik:
                              </Label>
                              <Input
                                placeholder="Contoh: Engsel patah / kain sobek..."
                                value={item.deskripsi}
                                onChange={(e) =>
                                  handleUpdateItemPatch(idx, { deskripsi: e.target.value })
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-[10px] font-bold text-[#78350F] flex items-center justify-between">
                                <span>Biaya Ganti Rugi:</span>
                                {isCostOverridden && (
                                  <span className="text-[9px] text-[#DC2626] font-bold">Override</span>
                                )}
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                step={5000}
                                value={item.biayaGantiRugi}
                                onChange={(e) =>
                                  handleUpdateItemBiaya(idx, Math.max(0, parseInt(e.target.value, 10) || 0))
                                }
                                className={`h-8 text-xs font-bold ${
                                  isCostOverridden
                                    ? "text-[#DC2626] border-[#FECACA] bg-[#FEF2F2]"
                                    : "text-[#991B1B]"
                                }`}
                              />
                            </div>

                            {/* Alasan Override jika biaya diubah manual */}
                            {isCostOverridden && (
                              <div className="sm:col-span-12 space-y-1 p-2 bg-[#FEF2F2] rounded border border-[#FECACA]">
                                <Label className="text-[10px] font-bold text-[#991B1B] flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Alasan Override Biaya Ganti Rugi (Wajib Diisi):
                                </Label>
                                <Input
                                  placeholder="Contoh: Kerusakan minor dapat diperbaiki sendiri tanpa beli baru..."
                                  value={item.alasanOverride || ""}
                                  onChange={(e) =>
                                    handleUpdateItemPatch(idx, { alasanOverride: e.target.value })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                            )}

                            {/* Foto Bukti Kerusakan */}
                            <div className="sm:col-span-12 flex items-center justify-between pt-1">
                              {item.fotoUrl ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold text-[#2E5E4E] flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Foto bukti kerusakan terlampir
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemPatch(idx, { fotoUrl: undefined })}
                                    className="text-[10px] text-[#991B1B] hover:underline"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ) : (
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-[#FAFAF8] border border-[#E8E8E1] hover:bg-white cursor-pointer text-[#5F7A84]">
                                  <Upload className="h-3 w-3" />
                                  <span>Unggah Bukti Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
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
                Kalkulasi Buku Besar Penyelesaian Deposit &amp; Tagihan
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#5F7A84]">
                  <span>Uang Jaminan (Deposit) Awal:</span>
                  <span className="font-bold text-[#234E5C]">
                    + {formatRupiah(depositAwal)}
                  </span>
                </div>

                {lateFee > 0 && (
                  <div className="flex justify-between text-[#991B1B]">
                    <span>Total Denda Keterlambatan ({lateDays} hari):</span>
                    <span className="font-bold">- {formatRupiah(lateFee)}</span>
                  </div>
                )}

                {totalGantiRugi > 0 && (
                  <div className="flex justify-between text-[#991B1B]">
                    <span>Total Ganti Rugi Kerusakan Fisik:</span>
                    <span className="font-bold">- {formatRupiah(totalGantiRugi)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-[#E8E8E1] pt-1.5 font-bold text-[#234E5C]">
                  <span>Total Kewajiban Pelanggan:</span>
                  <span>{formatRupiah(totalKewajiban)}</span>
                </div>

                {/* Hasil Akhir Deposit */}
                <div
                  className={`p-3.5 rounded-xl border mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    netRefund >= 0
                      ? "bg-[#E2F0D9] border-[#C5E1A5] text-[#2E5E4E]"
                      : "bg-[#FEF3C7] border-[#FDE68A] text-[#78350F]"
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-sm block">
                      {netRefund >= 0
                        ? "Deposit Dikembalikan (Masuk Antrean Refund):"
                        : "Deposit Habis. Pelunasan Tambahan Dibayar di Toko:"}
                    </span>
                    <span className="text-[11px] opacity-90">
                      {netRefund >= 0
                        ? `Sisa deposit sebesar ${formatRupiah(sisaRefundDeposit)} akan masuk ke antrean transfer admin.`
                        : `Biaya denda & kerusakan melebihi deposit. Sisa ${formatRupiah(kekuranganBayar)} telah lunas dibayar langsung oleh pelanggan di kasir toko.`}
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
                Catatan Pengembalian &amp; Kondisi Akhir (Opsional)
              </Label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Contoh: Unit telah diterima kembali lengkap. Sisa deposit akan ditransfer balik..."
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
                className="text-xs font-bold gap-2 px-6 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Tinjau &amp; Simpan Pengembalian</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI RINGKASAN SEBELUM DISIMPAN */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#A0630F]" />
              <span>Konfirmasi Penyelesaian Pengembalian</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs text-[#5F7A84]">
            <p className="leading-relaxed">
              Anda akan memproses penyelesaian pengembalian untuk booking <strong>#{booking.kode_booking}</strong> dengan rincian berikut:
            </p>

            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E8E8E1] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Denda Keterlambatan:</span>
                <span className="font-bold text-[#991B1B]">{formatRupiah(lateFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ganti Rugi Kerusakan:</span>
                <span className="font-bold text-[#991B1B]">{formatRupiah(totalGantiRugi)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E8E1] pt-1">
                <span>Total Beban Kewajiban:</span>
                <span className="font-extrabold text-[#234E5C]">{formatRupiah(totalKewajiban)}</span>
              </div>
              <div className="flex justify-between">
                <span>Deposit Awal:</span>
                <span className="font-bold text-[#234E5C]">{formatRupiah(depositAwal)}</span>
              </div>
            </div>

            {netRefund >= 0 ? (
              <div className="p-3 bg-[#E2F0D9] border border-[#C5E1A5] rounded-xl text-[#2E5E4E] text-[11px] space-y-1">
                <span className="font-bold block">✅ Mutasi Otomatis yang Akan Dicatat:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {potonganDenda > 0 && <li>Pemasukan denda: {formatRupiah(potonganDenda)} (Potong deposit)</li>}
                  {potonganGantiRugi > 0 && <li>Pemasukan ganti rugi: {formatRupiah(potonganGantiRugi)} (Potong deposit)</li>}
                  <li>Refund deposit: {formatRupiah(sisaRefundDeposit)} (Status: Menunggu Transfer)</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-[#78350F] text-[11px] space-y-1">
                <span className="font-bold block">💵 Mutasi Otomatis yang Akan Dicatat:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Deposit dipotong habis: {formatRupiah(depositAwal)}</li>
                  <li>Pelunasan tunai di toko: {formatRupiah(kekuranganBayar)} (Status: Lunas Terverifikasi)</li>
                  <li>Total denda &amp; kerusakan masuk ke pendapatan toko, status booking menjadi <strong>Selesai</strong>.</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Kembali Edit
            </Button>
            <Button
              type="button"
              variant="warm"
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="text-xs font-bold gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Menyimpan Transaksi..." : "Konfirmasi & Simpan Buku Besar"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RentalReturnModal;
