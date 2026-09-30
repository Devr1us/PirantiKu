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

  // Bawaan: Mulai besok atau hari ini selama 1 hari
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
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-6">
        {/* Header Widget */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Biaya Sewa
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {formatRupiah(equipment.harga_per_hari)}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">/ hari</span>
            </div>
            {equipment.harga_mingguan && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Paket 7 hari: {formatRupiah(equipment.harga_mingguan)}
              </p>
            )}
          </div>

          {/* Sisa Stok Real-Time */}
          <div className="text-right">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Stok Pilihan
            </span>
            {isLoadingStock ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 animate-spin rounded-full border border-primary border-t-transparent" />
                Mengecek...
              </span>
            ) : isAvailable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Sisa {sisaStok} unit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 text-xs font-bold">
                Stok Habis
              </span>
            )}
          </div>
        </div>

        {/* Pemilih Rentang Tanggal Kalender */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Pilih Tanggal Sewa
            </label>
            <span className="text-xs font-bold text-primary">
              {pricing.days} Hari Sewa
            </span>
          </div>

          {/* Trigger Tombol Ringkas */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex flex-col text-left p-3 rounded-2xl border border-border bg-muted/30 hover:border-primary/50 transition-colors"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                Mulai Sewa
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                {formatDateIndo(startDate, "d MMM yyyy")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex flex-col text-left p-3 rounded-2xl border border-border bg-muted/30 hover:border-primary/50 transition-colors"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                Selesai Sewa
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                {formatDateIndo(endDate, "d MMM yyyy")}
              </span>
            </button>
          </div>

          {/* Kalender Interaktif Dropdown */}
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

        {/* Pemilih Jumlah Alat (Qty) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Jumlah Unit</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Maks: {sisaStok} unit
            </span>
          </label>
          <div className="flex items-center justify-between p-2 rounded-2xl border border-border bg-muted/20">
            <span className="text-xs text-muted-foreground pl-2">
              Kuantitas sewa
            </span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={qty <= 1}
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="h-8 w-8 rounded-xl"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center text-sm font-bold text-foreground">
                {qty}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={qty >= sisaStok}
                onClick={() => setQty((prev) => Math.min(sisaStok, prev + 1))}
                className="h-8 w-8 rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ringkasan Estimasi Biaya Beranimasi */}
        <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>
              Sewa {qty} unit x {pricing.days} hari
            </span>
            <span className="font-semibold text-foreground">
              {formatRupiah(pricing.totalSewa)}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              Deposit jaminan (dikembalikan)
              <Info className="h-3 w-3 text-muted-foreground/70" />
            </span>
            <span className="font-semibold text-foreground">
              {formatRupiah(pricing.totalDeposit)}
            </span>
          </div>

          <div className="flex justify-between text-primary font-medium border-t border-border/60 pt-2">
            <span>Uang Muka / DP ({pricing.dpPersen}%)</span>
            <span className="font-bold">{formatRupiah(pricing.dpJumlah)}</span>
          </div>

          <div className="flex justify-between text-muted-foreground text-[11px]">
            <span>Sisa dibayar saat pengambilan</span>
            <span>{formatRupiah(pricing.sisaSaatAmbil)}</span>
          </div>

          <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-border pt-2">
            <span>Total Estimasi Biaya</span>
            <span className="text-base text-primary">
              {formatRupiah(pricing.totalKeseluruhan)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Button
            type="button"
            variant="warm"
            disabled={!isAvailable}
            onClick={handleRentNow}
            className="w-full h-12 rounded-2xl font-bold text-sm shadow-md shadow-accent-warm/25"
          >
            <Zap className="h-4 w-4 mr-2" />
            Sewa Sekarang
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="w-full h-11 rounded-2xl font-semibold text-sm border-border hover:border-primary/40"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Tambah ke Keranjang
          </Button>
        </div>

        {/* Jaminan Kenyamanan */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Alat Bergaransi
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Refund Deposit Cepat
          </span>
        </div>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3.5 px-4 shadow-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            Estimasi ({pricing.days} hari sewa)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-primary">
              {formatRupiah(pricing.totalKeseluruhan)}
            </span>
            <span className="text-[10px] text-muted-foreground">
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
            className="h-10 w-10 rounded-xl"
            aria-label="Tambah ke keranjang"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="warm"
            disabled={!isAvailable}
            onClick={handleRentNow}
            className="h-10 px-5 rounded-xl font-bold text-xs shadow-md shadow-accent-warm/20"
          >
            Sewa Sekarang
          </Button>
        </div>
      </div>
    </>
  );
}
