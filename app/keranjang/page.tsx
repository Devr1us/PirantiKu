"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Info,
  Package,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useCart } from "@/lib/cart-context";
import { calculateRentalPrice } from "@/lib/pricing";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { RentalDatePicker } from "@/components/booking/rental-date-picker";
import { H1, Lead } from "@/components/ui/typography";
import { toast } from "sonner";

export default function KeranjangPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, updateQty, removeItem, clearCart, isLoaded } = useCart();

  const paramMulai = searchParams.get("mulai");
  const paramSelesai = searchParams.get("selesai");

  // Inisialisasi tanggal sewa dari URL param -> sessionStorage -> fallback hari ini & besok
  const [startDate, setStartDate] = React.useState<string>(() => {
    if (paramMulai) return paramMulai;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("pirantiku_booking_dates");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.startDate) return parsed.startDate;
        }
      } catch {
        // Fallback
      }
    }
    return format(new Date(), "yyyy-MM-dd");
  });

  const [endDate, setEndDate] = React.useState<string>(() => {
    if (paramSelesai) return paramSelesai;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("pirantiku_booking_dates");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.endDate) return parsed.endDate;
        }
      } catch {
        // Fallback
      }
    }
    return format(addDays(new Date(), 1), "yyyy-MM-dd");
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState<boolean>(false);

  // Sync perubahan tanggal ke sessionStorage
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    try {
      sessionStorage.setItem(
        "pirantiku_booking_dates",
        JSON.stringify({ startDate: start, endDate: end })
      );
    } catch {
      // Ignore
    }
  };

  // Preset Durasi Cepat
  const applyPresetDays = (days: number) => {
    try {
      const [y, m, d] = startDate.split("-").map(Number);
      const start = new Date(y, m - 1, d);
      const newEnd = addDays(start, Math.max(0, days - 1));
      const newEndStr = format(newEnd, "yyyy-MM-dd");
      handleDateChange(startDate, newEndStr);
    } catch {
      // Fallback
    }
  };

  // Kalkulasi harga seluruh keranjang
  const pricing = React.useMemo(() => {
    const pricingItems = items.map((i) => ({
      equipmentId: i.equipmentId,
      qty: i.qty,
      harga_per_hari: i.harga_per_hari,
      harga_mingguan: i.harga_mingguan,
      deposit: i.deposit,
    }));

    return calculateRentalPrice(pricingItems, startDate, endDate, 30);
  }, [items, startDate, endDate]);

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Keranjang booking Anda masih kosong.");
      return;
    }

    try {
      sessionStorage.setItem(
        "pirantiku_booking_dates",
        JSON.stringify({ startDate, endDate })
      );
    } catch {
      // Ignore
    }

    router.push(`/checkout?mulai=${startDate}&selesai=${endDate}`);
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
          <p className="text-sm text-[#5F7A84]">Memuat keranjang booking...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:py-24 bg-[#FAFAF8] text-[#234E5C]">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-[#E8E8E1] bg-white shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F3EF] text-[#234E5C] mb-5">
            <ShoppingCart className="h-8 w-8 stroke-[1.8]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#234E5C]">
            Keranjang Booking Kosong
          </h1>
          <p className="mt-2 text-sm text-[#5F7A84] leading-relaxed">
            Belum ada peralatan yang dipilih. Buka katalog untuk melihat berbagai pilihan alat dan perkakas yang siap dibooking.
          </p>
          <div className="mt-6">
            <Link href="/alat">
              <Button variant="warm" className="px-6 text-sm font-bold">
                Mulai Pilih Alat &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href="/alat"
            className="text-xs text-[#5F7A84] hover:text-[#234E5C] transition-colors flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Katalog
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-[#5F7A84] hover:text-[#DC2626] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Kosongkan Keranjang
          </button>
        </div>

        <H1 className="section-title block pt-1">
          KERANJANG BOOKING
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Tentukan rentang tanggal booking dan periksa jumlah unit peralatan sebelum melanjutkan ke langkah pembayaran DP.
        </Lead>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Kolom Kiri: Jadwal Sewa & Daftar Barang */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Jadwal Sewa Terpadu */}
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#234E5C]" />
                  Jadwal Rentang Booking
                </h3>
                <p className="text-xs text-[#5F7A84] mt-0.5">
                  Tanggal booking berlaku seragam untuk seluruh barang di keranjang ini
                </p>
              </div>
              <span className="text-xs font-bold text-[#A0630F] px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A]">
                {pricing.days} Hari Durasi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex flex-col text-left p-3.5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] hover:border-[#234E5C] transition-colors cursor-pointer"
              >
                <span className="text-[10px] text-[#5F7A84] uppercase font-bold">
                  Mulai Pengambilan
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#234E5C] truncate mt-0.5">
                  {formatDateIndo(startDate, "d MMMM yyyy")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex flex-col text-left p-3.5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] hover:border-[#234E5C] transition-colors cursor-pointer"
              >
                <span className="text-[10px] text-[#5F7A84] uppercase font-bold">
                  Batas Pengembalian
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#234E5C] truncate mt-0.5">
                  {formatDateIndo(endDate, "d MMMM yyyy")}
                </span>
              </button>
            </div>

            {/* Preset Durasi Cepat */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E8E8E1]/60">
              <span className="text-[11px] font-semibold text-[#5F7A84]">Preset Cepat:</span>
              {[
                { label: "1 Hari", days: 1 },
                { label: "2 Hari", days: 2 },
                { label: "3 Hari (Weekend)", days: 3 },
                { label: "7 Hari (Hemat)", days: 7, isPromo: true },
                { label: "14 Hari", days: 14, isPromo: true },
              ].map((preset) => {
                const isActive = pricing.days === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => applyPresetDays(preset.days)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#234E5C] text-white"
                        : preset.isPromo
                        ? "bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5] hover:bg-[#d4eac7]"
                        : "bg-[#F3F3EF] text-[#234E5C] border border-[#E8E8E1] hover:bg-[#E8E8E1]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Banner Diskon Mingguan Aktif */}
            {pricing.days >= 7 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E2F0D9] border border-[#C5E1A5] text-[#2E5E4E] text-xs font-semibold">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Paket Mingguan Aktif! Tarif sewa otomatis dihitung dengan harga mingguan yang lebih hemat.</span>
              </div>
            )}

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
                    onChange={handleDateChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Daftar Barang Disewa */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#234E5C] uppercase tracking-wider">
              Daftar Barang Disewa ({items.length})
            </h3>

            <div className="space-y-3">
              {items.map((item) => {
                const hasStockWarning = item.stokTersedia > 0 && item.qty > item.stokTersedia;
                return (
                  <div
                    key={item.equipmentId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-xl border border-[#E8E8E1] bg-white shadow-sm gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {/* Thumbnail Alat */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-[#E8E8E1] bg-[#F5F3EB]">
                        {item.foto_url ? (
                          <Image
                            src={item.foto_url}
                            alt={item.nama}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#5F7A84]">
                            <Package className="h-6 w-6 stroke-[1.8]" />
                          </div>
                        )}
                      </div>

                      {/* Detail Teks */}
                      <div className="space-y-1">
                        <Link
                          href={`/alat/${item.slug}`}
                          className="font-bold text-sm text-[#234E5C] hover:text-[#A0630F] transition-colors line-clamp-1"
                        >
                          {item.nama}
                        </Link>
                        <p className="text-xs text-[#5F7A84]">
                          {formatRupiah(item.harga_per_hari)} / hari
                          {item.harga_mingguan && (
                            <span className="text-[10px] text-[#2E5E4E] ml-1 font-semibold">
                              (Mingguan: {formatRupiah(item.harga_mingguan)})
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[#5F7A84]">
                          Deposit Jaminan: {formatRupiah(item.deposit)} / unit
                        </p>
                        {hasStockWarning && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#DC2626] font-bold">
                            <AlertCircle className="h-3 w-3" />
                            Stok unit tersedia: {item.stokTersedia} unit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Kontrol Kuantitas & Subtotal */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-[#E8E8E1]">
                      {/* Stepper Jumlah */}
                      <div className="flex items-center border border-[#E8E8E1] rounded-xl overflow-hidden bg-[#FAFAF8]">
                        <button
                          type="button"
                          onClick={() => updateQty(item.equipmentId, item.qty - 1)}
                          className="p-2 hover:bg-[#E8E8E1] transition-colors text-[#234E5C] cursor-pointer"
                          aria-label="Kurangi kuantitas"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#234E5C] min-w-[28px] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.equipmentId, item.qty + 1)}
                          className="p-2 hover:bg-[#E8E8E1] transition-colors text-[#234E5C] cursor-pointer"
                          aria-label="Tambah kuantitas"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.equipmentId)}
                        className="text-[11px] text-[#5F7A84] hover:text-[#DC2626] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Biaya Booking */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-[var(--navbar-offset)] rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-3">
              Ringkasan Booking
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#5F7A84]">
                <span>Total Durasi Sewa</span>
                <span className="font-bold text-[#234E5C]">
                  {pricing.days} Hari
                </span>
              </div>

              <div className="flex justify-between text-[#5F7A84]">
                <span>Subtotal Harga Booking</span>
                <span className="font-bold text-[#234E5C]">
                  {formatRupiah(pricing.totalSewa)}
                </span>
              </div>

              <div className="flex justify-between text-[#5F7A84]">
                <span className="flex items-center gap-1">
                  Deposit Jaminan (Kembali)
                  <Info className="h-3 w-3 text-[#5F7A84]" />
                </span>
                <span className="font-bold text-[#234E5C]">
                  {formatRupiah(pricing.totalDeposit)}
                </span>
              </div>

              {/* Rincian DP */}
              <div className="rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] p-3.5 space-y-1.5 mt-2">
                <div className="flex justify-between text-[#A0630F] font-bold text-xs">
                  <span>Uang Muka / DP (30%)</span>
                  <span>{formatRupiah(pricing.dpJumlah)}</span>
                </div>
                <p className="text-[11px] text-[#5F7A84] leading-relaxed">
                  Cukup bayar DP 30% untuk mengunci stok alat pada tanggal pilihan Anda.
                </p>
              </div>

              <div className="flex justify-between text-[#5F7A84] text-[11px] pt-1">
                <span>Sisa pelunasan saat ambil alat</span>
                <span className="font-semibold text-[#234E5C]">
                  {formatRupiah(pricing.sisaSaatAmbil)}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-sm font-extrabold text-[#234E5C] border-t border-[#E8E8E1] pt-3">
                <span>Total Estimasi Biaya</span>
                <span className="text-lg text-[#A0630F] font-extrabold">
                  {formatRupiah(pricing.totalKeseluruhan)}
                </span>
              </div>
            </div>

            {/* Tombol Lanjut ke Checkout */}
            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                variant="warm"
                onClick={handleCheckout}
                className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2"
              >
                Lanjut ke Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Link href="/alat" className="block text-center">
                <Button variant="ghost" className="w-full text-xs h-9 font-semibold">
                  + Tambah Alat Lain
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#5F7A84] pt-1 border-t border-[#E8E8E1]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#234E5C] shrink-0" />
              <span>Deposit dikembalikan utuh saat alat kembali baik</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
