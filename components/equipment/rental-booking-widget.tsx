"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Info,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { format, addDays } from "date-fns";
import type { EquipmentWithDetails } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { calculateRentalPrice } from "@/lib/pricing";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { RentalDatePicker } from "@/components/booking/rental-date-picker";
import { toast } from "sonner";

interface RentalBookingWidgetProps {
  equipment: EquipmentWithDetails;
  defaultDpPersen?: number;
}

export function RentalBookingWidget({
  equipment,
  defaultDpPersen = 30,
}: RentalBookingWidgetProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [startDate, setStartDate] = React.useState<string>(todayStr);
  const [endDate, setEndDate] = React.useState<string>(tomorrowStr);
  const [qty, setQty] = React.useState<number>(1);

  const [disabledDates, setDisabledDates] = React.useState<string[]>([]);
  const [sisaStok, setSisaStok] = React.useState<number>(
    Math.max(0, (equipment.stok || 0) - (equipment.stok_rusak || 0))
  );
  const [isLoadingStock, setIsLoadingStock] = React.useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState<boolean>(false);

  // 1. Ambil daftar tanggal_penuh saat komponen dimuat
  React.useEffect(() => {
    async function loadDisabledDates() {
      try {
        const supabase = createClient();
        const pDari = format(new Date(), "yyyy-MM-dd");
        const pSampai = format(addDays(new Date(), 365), "yyyy-MM-dd");

        const { data, error } = await supabase.rpc("tanggal_penuh", {
          p_equipment_id: equipment.id,
          p_dari: pDari,
          p_sampai: pSampai,
        });

        if (!error && Array.isArray(data)) {
          setDisabledDates(data);
        }
      } catch (err) {
        console.error("Gagal memeriksa tanggal penuh:", err);
      }
    }

    loadDisabledDates();
  }, [equipment.id]);

  // 2. Ambil sisa_stok real-time setiap rentang tanggal berubah
  React.useEffect(() => {
    let isCancelled = false;

    async function checkStock() {
      if (!startDate || !endDate) return;
      setIsLoadingStock(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("sisa_stok", {
          p_equipment_id: equipment.id,
          p_mulai: startDate,
          p_selesai: endDate,
        });

        if (!isCancelled) {
          if (!error && typeof data === "number") {
            setSisaStok(data);
            if (qty > data) {
              setQty(Math.max(1, data));
            }
          }
        }
      } catch (err) {
        console.error("Gagal cek sisa stok:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingStock(false);
        }
      }
    }

    checkStock();

    return () => {
      isCancelled = true;
    };
  }, [equipment.id, startDate, endDate, qty]);

  // Hitung ringkasan harga
  const pricing = React.useMemo(() => {
    return calculateRentalPrice(
      [
        {
          equipmentId: equipment.id,
          qty,
          harga_per_hari: equipment.harga_per_hari,
          harga_mingguan: equipment.harga_mingguan,
          deposit: equipment.deposit,
        },
      ],
      startDate,
      endDate,
      defaultDpPersen
    );
  }, [equipment, qty, startDate, endDate, defaultDpPersen]);

  const isAvailable = sisaStok > 0;

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error("Maaf, stok alat tidak tersedia pada tanggal tersebut.");
      return;
    }

    const primaryImage =
      equipment.images?.find((img) => img.is_utama)?.url ||
      equipment.images?.[0]?.url ||
      null;

    addItem(
      {
        equipmentId: equipment.id,
        nama: equipment.nama,
        slug: equipment.slug,
        kategoriNama: equipment.category?.nama,
        harga_per_hari: equipment.harga_per_hari,
        harga_mingguan: equipment.harga_mingguan,
        deposit: equipment.deposit,
        foto_url: primaryImage,
        stokTersedia: sisaStok,
      },
      qty
    );

    toast.success(`${equipment.nama} (${qty} unit) berhasil ditambah ke keranjang!`);
  };

  const handleRentNow = () => {
    if (!isAvailable) {
      toast.error("Maaf, stok alat tidak tersedia pada tanggal tersebut.");
      return;
    }
    handleAddToCart();
    router.push("/keranjang");
  };

  return (
    <>
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-6 text-[#234E5C]">
        {/* Header Widget: Harga Sewa & Stok */}
        <div className="flex items-start justify-between border-b border-[#E8E8E1] pb-4">
          <div>
            <span className="text-[11px] font-bold text-[#5F7A84] uppercase tracking-wider block">
              Tarif Sewa
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#A0630F]">
                {formatRupiah(equipment.harga_per_hari)}
              </span>
              <span className="text-xs text-[#5F7A84]">/ hari</span>
            </div>
            {equipment.harga_mingguan && (
              <p className="text-xs font-semibold text-[#2E5E4E] mt-0.5">
                Paket 7 hari: {formatRupiah(equipment.harga_mingguan)}
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-[#5F7A84] block">
              Status Unit
            </span>
            {isLoadingStock ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#5F7A84] mt-1">
                <span className="h-2 w-2 animate-spin rounded-full border border-[#234E5C] border-t-transparent" />
                Mengecek...
              </span>
            ) : isAvailable ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5] px-2.5 py-0.5 text-xs font-bold mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E5E4E]" />
                Sisa {sisaStok} unit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] px-2.5 py-0.5 text-xs font-bold mt-1">
                Stok Habis
              </span>
            )}
          </div>
        </div>

        {/* Pemilih Tanggal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#234E5C] flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#234E5C]" />
              Tanggal Pemakaian
            </label>
            <span className="text-xs font-bold text-[#A0630F]">
              {pricing.days} Hari Durasi
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex flex-col text-left p-3 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] hover:border-[#234E5C] transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#5F7A84] uppercase font-bold">
                Mulai Sewa
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#234E5C] truncate mt-0.5">
                {formatDateIndo(startDate, "d MMM yyyy")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex flex-col text-left p-3 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] hover:border-[#234E5C] transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#5F7A84] uppercase font-bold">
                Selesai Sewa
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#234E5C] truncate mt-0.5">
                {formatDateIndo(endDate, "d MMM yyyy")}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {isDatePickerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2"
              >
                <RentalDatePicker
                  startDate={startDate}
                  endDate={endDate}
                  disabledDates={disabledDates}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pemilih Jumlah Unit (Qty) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#234E5C] flex items-center justify-between">
            <span>Jumlah Unit</span>
            <span className="text-[11px] text-[#5F7A84] font-normal">
              Maks ketersediaan: {sisaStok} unit
            </span>
          </label>
          <div className="flex items-center justify-between p-2 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8]">
            <span className="text-xs font-semibold text-[#5F7A84] pl-2">
              Kuantitas
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={qty <= 1}
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="h-8 w-8 rounded-full border-[#E8E8E1] hover:border-[#234E5C]"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center text-sm font-bold text-[#234E5C]">
                {qty}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={qty >= sisaStok}
                onClick={() => setQty((prev) => Math.min(sisaStok, prev + 1))}
                className="h-8 w-8 rounded-full border-[#E8E8E1] hover:border-[#234E5C]"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ringkasan Estimasi Biaya di Kartu Putih */}
        <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-4 space-y-2 text-xs">
          <div className="flex justify-between text-[#5F7A84]">
            <span>
              Sewa {qty} unit x {pricing.days} hari
            </span>
            <span className="font-bold text-[#234E5C]">
              {formatRupiah(pricing.totalSewa)}
            </span>
          </div>

          <div className="flex justify-between text-[#5F7A84]">
            <span className="flex items-center gap-1">
              Deposit jaminan (dikembalikan)
              <Info className="h-3 w-3 text-[#5F7A84]" />
            </span>
            <span className="font-bold text-[#234E5C]">
              {formatRupiah(pricing.totalDeposit)}
            </span>
          </div>

          <div className="flex justify-between text-[#A0630F] font-bold border-t border-[#E8E8E1] pt-2">
            <span>Uang Muka / DP ({pricing.dpPersen}%)</span>
            <span>{formatRupiah(pricing.dpJumlah)}</span>
          </div>

          <div className="flex justify-between text-[#5F7A84] text-[11px]">
            <span>Sisa pelunasan saat pengambilan</span>
            <span className="font-semibold text-[#234E5C]">{formatRupiah(pricing.sisaSaatAmbil)}</span>
          </div>

          {/* Animasi Total Harga saat Berubah */}
          <div className="flex justify-between items-baseline text-sm font-extrabold text-[#234E5C] border-t border-[#E8E8E1] pt-3">
            <span>Total Keseluruhan</span>
            <motion.span
              key={pricing.totalKeseluruhan}
              initial={{ scale: 1.08, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="text-base text-[#A0630F] font-extrabold"
            >
              {formatRupiah(pricing.totalKeseluruhan)}
            </motion.span>
          </div>
        </div>

        {/* Action Buttons: Tombol Ochre Tambah ke Keranjang & Sewa Sekarang */}
        <div className="space-y-2.5">
          <Button
            type="button"
            variant="warm"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Tambah ke Keranjang
          </Button>

          <Button
            type="button"
            variant="petrol"
            disabled={!isAvailable}
            onClick={handleRentNow}
            className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Sewa Sekarang
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] text-[#5F7A84] pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#234E5C]" />
            Alat Diuji Sebelum Diberikan
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#234E5C]" />
            Deposit Kembali Penuh
          </span>
        </div>
      </div>

      {/* Sticky Bar di Mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E8E8E1] p-3 px-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#5F7A84] font-semibold block">
            Total ({pricing.days} hari sewa)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-[#A0630F]">
              {formatRupiah(pricing.totalKeseluruhan)}
            </span>
            <span className="text-[10px] text-[#5F7A84]">
              (DP {formatRupiah(pricing.dpJumlah)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="h-10 w-10 border-[#E8E8E1]"
            aria-label="Tambah ke keranjang"
          >
            <ShoppingCart className="h-4 w-4 text-[#234E5C]" />
          </Button>
          <Button
            type="button"
            variant="warm"
            disabled={!isAvailable}
            onClick={handleRentNow}
            className="h-10 px-5 text-xs font-bold"
          >
            Sewa Sekarang
          </Button>
        </div>
      </div>
    </>
  );
}
