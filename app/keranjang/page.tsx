"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Layers,
  ArrowLeft,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useCart } from "@/lib/cart-context";
import { calculateRentalPrice } from "@/lib/pricing";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { RentalDatePicker } from "@/components/booking/rental-date-picker";
import { toast } from "sonner";

export default function KeranjangPage() {
  const router = useRouter();
  const { items, updateQty, removeItem, clearCart, isLoaded } = useCart();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [startDate, setStartDate] = React.useState<string>(todayStr);
  const [endDate, setEndDate] = React.useState<string>(tomorrowStr);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState<boolean>(false);

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
      toast.error("Keranjang sewa Anda masih kosong.");
      return;
    }

    // Simpan tanggal sewa pilihan ke sessionStorage atau query param untuk checkout
    sessionStorage.setItem(
      "sewadongkak_booking_dates",
      JSON.stringify({ startDate, endDate })
    );

    router.push(`/checkout?mulai=${startDate}&selesai=${endDate}`);
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat keranjang sewa...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-dashed border-border bg-card shadow-sm"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Keranjang Sewa Masih Kosong
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Anda belum menambahkan peralatan apa pun. Jelajahi katalog kami dan temukan alat yang Anda butuhkan untuk proyek atau kegiatan Anda.
          </p>
          <div className="mt-8">
            <Link href="/alat">
              <Button variant="warm" className="rounded-2xl h-11 px-6 font-bold shadow-md shadow-accent-warm/20">
                Mulai Pilih Alat
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/alat"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Katalog
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Keranjang Sewa ({items.length} Macam Alat)
          </h1>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive self-start sm:self-auto rounded-xl"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Kosongkan Keranjang
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Kolom Kiri: Daftar Alat & Pemilih Tanggal Sewa (7 Kolom) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Card Pemilih Rentang Tanggal Sewa Global */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Jadwal Rentang Sewa
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tanggal sewa berlaku untuk seluruh peralatan di keranjang ini
                </p>
              </div>
              <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                {pricing.days} Hari Sewa
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex flex-col text-left p-3.5 rounded-2xl border border-border bg-muted/30 hover:border-primary/50 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Mulai Pengambilan
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
                  {formatDateIndo(startDate, "d MMMM yyyy")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex flex-col text-left p-3.5 rounded-2xl border border-border bg-muted/30 hover:border-primary/50 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Batas Pengembalian
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
                  {formatDateIndo(endDate, "d MMMM yyyy")}
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
                    onChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Daftar Barang dalam Keranjang */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Daftar Barang Disewa
            </h3>

            <div className="space-y-3">
              {items.map((item) => (
                <motion.div
                  key={item.equipmentId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-3xl border border-border bg-card shadow-sm gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Gambar Thumbnail */}
                    <div className="relative h-18 w-20 sm:h-20 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                      {item.foto_url ? (
                        <Image
                          src={item.foto_url}
                          alt={item.nama}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                          <Layers className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Info Barang */}
                    <div className="space-y-1">
                      {item.kategoriNama && (
                        <span className="text-[10px] font-semibold text-primary uppercase">
                          {item.kategoriNama}
                        </span>
                      )}
                      <Link
                        href={`/alat/${item.slug}`}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors block line-clamp-1"
                      >
                        {item.nama}
                      </Link>
                      <div className="flex items-baseline gap-2 text-xs">
                        <span className="font-extrabold text-foreground">
                          {formatRupiah(item.harga_per_hari)}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          /hari
                        </span>
                        {item.deposit > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            (Deposit: {formatRupiah(item.deposit)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kontrol Qty & Tombol Hapus */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQty(item.equipmentId, item.qty - 1)}
                        className="h-7 w-7 rounded-xl"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-xs font-bold">
                        {item.qty}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQty(item.equipmentId, item.qty + 1)}
                        className="h-7 w-7 rounded-xl"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.equipmentId)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl"
                      aria-label="Hapus alat dari keranjang"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Biaya & Checkout (5 Kolom) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">
              Ringkasan Biaya Sewa
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Durasi Masa Sewa</span>
                <span className="font-semibold text-foreground">
                  {pricing.days} Hari
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Harga Sewa</span>
                <span className="font-semibold text-foreground">
                  {formatRupiah(pricing.totalSewa)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Deposit Jaminan
                  <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                </span>
                <span className="font-semibold text-foreground">
                  {formatRupiah(pricing.totalDeposit)}
                </span>
              </div>

              {/* Rincian DP */}
              <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3.5 space-y-2 mt-2">
                <div className="flex justify-between text-primary font-bold">
                  <span>DP Dibayar Sekarang (30%)</span>
                  <span>{formatRupiah(pricing.dpJumlah)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cukup bayar DP 30% untuk mengunci stok alat pada tanggal pilihan Anda.
                </p>
              </div>

              <div className="flex justify-between text-muted-foreground text-[11px] pt-1">
                <span>Sisa pelunasan saat pengambilan</span>
                <span className="font-medium text-foreground">
                  {formatRupiah(pricing.sisaSaatAmbil)}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-sm font-extrabold text-foreground border-t border-border pt-4">
                <span>Total Biaya Keseluruhan</span>
                <span className="text-lg text-primary font-extrabold">
                  {formatRupiah(pricing.totalKeseluruhan)}
                </span>
              </div>
            </div>

            {/* Tombol Lanjut ke Checkout */}
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                variant="warm"
                onClick={handleCheckout}
                className="w-full h-12 rounded-2xl font-bold text-sm shadow-md shadow-accent-warm/25"
              >
                Lanjut ke Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Link href="/alat" className="block text-center">
                <Button variant="ghost" className="w-full rounded-2xl text-xs h-10">
                  Tambah Alat Lainnya
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>Deposit dikembalikan utuh setelah alat kembali baik</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
