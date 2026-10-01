"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  CreditCard,
  User as UserIcon,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { calculateRentalPrice } from "@/lib/pricing";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedText } from "@/components/ui/motion";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, clearCart, isLoaded } = useCart();

  const mulaiParam = searchParams.get("mulai");
  const selesaiParam = searchParams.get("selesai");

  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [userEmail, setUserEmail] = React.useState<string>("");
  const [catatan, setCatatan] = React.useState<string>("");
  const [rekeningInfo, setRekeningInfo] = React.useState<string>("BCA 1234567890 a/n PirantiKu");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [createdBookingCode, setCreatedBookingCode] = React.useState<string | null>(null);

  // Ambil tanggal sewa dari params atau fallback
  const startDate = mulaiParam || new Date().toISOString().split("T")[0];
  const endDate = selesaiParam || new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // 1. Muat profil user dan pengaturan
  React.useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push(`/login?next=/checkout?mulai=${startDate}&selesai=${endDate}`);
          return;
        }

        setUserEmail(user.email || "");

        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (prof) {
          setProfile(prof as Profile);
        }

        const { data: setRek } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "rekening_bank")
          .single();

        if (setRek?.value) {
          setRekeningInfo(setRek.value);
        }
      } catch (err) {
        console.error("Gagal inisialisasi checkout:", err);
      }
    }

    loadData();
  }, [router, startDate, endDate]);

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

  const handleProcessBooking = async () => {
    if (items.length === 0) {
      toast.error("Keranjang belanja kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const pItems = items.map((i) => ({
        equipment_id: i.equipmentId,
        qty: i.qty,
      }));

      const { data: bookingId, error } = await supabase.rpc("create_booking", {
        p_mulai: startDate,
        p_selesai: endDate,
        p_items: pItems,
        p_catatan: catatan.trim() || null,
      });

      if (error) {
        toast.error("Gagal membuat booking: " + error.message);
        return;
      }

      // Ambil kode booking yang dibuat
      if (bookingId) {
        const { data: bData } = await supabase
          .from("bookings")
          .select("kode_booking")
          .eq("id", bookingId)
          .single();

        setCreatedBookingCode(bData?.kode_booking || bookingId.slice(0, 8));
      }

      clearCart();
      setCurrentStep(3);
      toast.success("Pesanan booking berhasil dibuat!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
          <p className="text-sm text-[#5F7A84]">Memuat informasi checkout...</p>
        </div>
      </div>
    );
  }

  // Tampilan Sukses Checkout
  if (currentStep === 3 && createdBookingCode) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center space-y-6 bg-[#FAFAF8] text-[#234E5C]">
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-8 sm:p-12 shadow-sm space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E5E4E]">
              Pesanan Telah Terdaftar
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#234E5C]">
              Booking Berhasil Dibuat!
            </h1>
            <p className="text-sm text-[#5F7A84]">
              Kode Booking Anda:
            </p>
            <div className="inline-block py-2 px-6 rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] font-mono text-lg font-bold text-[#234E5C]">
              {createdBookingCode}
            </div>
          </div>

          {/* Rincian Pembayaran DP */}
          <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-5 text-left space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-2">
              Langkah Selanjutnya: Pembayaran DP
            </h3>
            <p className="text-[#5F7A84]">
              Silakan transfer uang muka (DP 30%) sejumlah:
            </p>
            <p className="text-xl font-bold text-[#A0630F]">
              {formatRupiah(pricing.dpJumlah)}
            </p>
            <div className="p-3 rounded-lg bg-white border border-[#E8E8E1] space-y-1">
              <span className="text-[11px] text-[#5F7A84] font-semibold">Tujuan Rekening:</span>
              <p className="text-sm font-bold text-[#234E5C]">{rekeningInfo}</p>
            </div>
            <p className="text-[11px] text-[#5F7A84] leading-relaxed">
              Setelah transfer, admin akan segera memverifikasi ketersediaan dan menjadwalkan pengambilan alat sesuai tanggal sewa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/booking-saya" className="flex-1">
              <Button variant="warm" className="w-full text-xs font-bold">
                Lihat Status Booking Saya
              </Button>
            </Link>
            <Link href="/alat" className="flex-1">
              <Button variant="outline" className="w-full text-xs font-bold">
                Kembali ke Katalog
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
        <Link
          href="/keranjang"
          className="text-xs text-[#5F7A84] hover:text-[#234E5C] transition-colors flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Keranjang
        </Link>
        <AnimatedText
          text="CHECKOUT PENYEWAAN"
          mode="word"
          as="h1"
          className="section-title block pt-1"
        />
        <p className="text-sm text-[#5F7A84] font-medium">
          Konfirmasi data penyewa, tinjau ringkasan biaya, dan amankan pesanan unit alat Anda.
        </p>
      </div>

      {/* Stepper Sederhana dengan Lingkaran Angka Petrol */}
      <div className="flex items-center justify-center max-w-xl mx-auto py-2">
        <div className="flex items-center gap-3">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep >= 1
                  ? "bg-[#234E5C] text-white"
                  : "border border-[#234E5C] text-[#234E5C]"
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold text-[#234E5C] hidden sm:inline">
              Data & Jadwal
            </span>
          </div>

          <div className="h-[1px] w-8 sm:w-16 bg-[#E8E8E1]" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep >= 2
                  ? "bg-[#234E5C] text-white"
                  : "border border-[#234E5C]/40 text-[#5F7A84]"
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-[#5F7A84] hidden sm:inline">
              Rincian & DP
            </span>
          </div>

          <div className="h-[1px] w-8 sm:w-16 bg-[#E8E8E1]" />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep >= 3
                  ? "bg-[#234E5C] text-white"
                  : "border border-[#234E5C]/40 text-[#5F7A84]"
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-[#5F7A84] hidden sm:inline">
              Konfirmasi
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Formulir Step (7 Kolom) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {currentStep === 1 && (
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-[#234E5C] flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <UserIcon className="h-5 w-5 text-[#234E5C]" />
                1. Data Identitas Penyewa
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5F7A84]">
                      Nama Lengkap
                    </Label>
                    <Input
                      value={profile?.nama || ""}
                      disabled
                      className="bg-[#F3F3EF] cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5F7A84]">
                      Nomor WhatsApp / HP
                    </Label>
                    <Input
                      value={profile?.no_hp || ""}
                      disabled
                      className="bg-[#F3F3EF] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#5F7A84]">
                    Alamat Email Terdaftar
                  </Label>
                  <Input
                    value={userEmail}
                    disabled
                    className="bg-[#F3F3EF] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#5F7A84]">
                    Catatan Tambahan untuk Admin (Opsional)
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Perlu adaptor tambahan, atau jam pengambilan sekitar pukul 14.00 WIB..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E8E1] bg-white p-3 text-xs text-[#234E5C] placeholder:text-[#5F7A84]/60 focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
                  />
                </div>

                <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-4 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#234E5C] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-[#234E5C]">
                      Jadwal Sewa Terpilih:
                    </span>
                    <p className="text-[#5F7A84]">
                      {formatDateIndo(startDate, "d MMM yyyy")} s/d {formatDateIndo(endDate, "d MMM yyyy")} ({pricing.days} Hari)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="warm"
                  onClick={() => setCurrentStep(2)}
                  className="px-8 text-xs font-bold"
                >
                  Lanjut ke Rincian & DP
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-[#234E5C] flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <CreditCard className="h-5 w-5 text-[#234E5C]" />
                2. Rincian Pembayaran & Rekening Tujuan
              </h2>

              <div className="space-y-4 text-xs">
                <p className="text-[#5F7A84] leading-relaxed">
                  Pesanan Anda akan tercatat dengan status <strong>Menunggu DP</strong>. Untuk mengunci unit, silakan transfer sejumlah DP ke rekening berikut:
                </p>

                <div className="p-4 rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
                    Rekening Pembayaran DP
                  </span>
                  <p className="text-base font-bold text-[#234E5C]">
                    {rekeningInfo}
                  </p>
                  <p className="text-[11px] text-[#5F7A84]">
                    Jumlah Uang Muka (DP 30%):{" "}
                    <strong className="text-[#A0630F] font-bold text-sm">
                      {formatRupiah(pricing.dpJumlah)}
                    </strong>
                  </p>
                </div>

                <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-4 space-y-2">
                  <h4 className="font-bold text-[#234E5C]">Ketentuan Pengambilan Unit:</h4>
                  <ul className="space-y-1 text-[#5F7A84] list-disc list-inside text-[11px]">
                    <li>Membawa KTP atau SIM asli atas nama pemesan.</li>
                    <li>Melunasi sisa biaya sewa ({formatRupiah(pricing.sisaSaatAmbil)}) saat serah terima.</li>
                    <li>Membayar deposit jaminan ({formatRupiah(pricing.totalDeposit)}) yang akan dikembalikan utuh saat alat kembali baik.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E8E8E1]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Kembali
                </Button>

                <Button
                  type="button"
                  variant="warm"
                  disabled={isSubmitting}
                  onClick={handleProcessBooking}
                  className="px-8 text-xs font-bold"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi & Buat Booking"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan (5 Kolom) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-3">
              Ringkasan Pesanan
            </h3>

            {/* List Barang Singkat */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.equipmentId} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-[#234E5C] line-clamp-1">
                      {item.nama}
                    </span>
                    <span className="text-[11px] text-[#5F7A84]">
                      {item.qty} unit x {pricing.days} hari
                    </span>
                  </div>
                  <span className="font-bold text-[#234E5C] shrink-0 ml-2">
                    {formatRupiah(item.harga_per_hari * item.qty * pricing.days)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E8E8E1] pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#5F7A84]">
                <span>Total Sewa Alat</span>
                <span className="font-bold text-[#234E5C]">{formatRupiah(pricing.totalSewa)}</span>
              </div>
              <div className="flex justify-between text-[#5F7A84]">
                <span>Deposit Jaminan (Kembali)</span>
                <span className="font-bold text-[#234E5C]">{formatRupiah(pricing.totalDeposit)}</span>
              </div>
              <div className="flex justify-between text-[#A0630F] font-bold border-t border-[#E8E8E1] pt-2">
                <span>DP 30% (Dibayar Sekarang)</span>
                <span>{formatRupiah(pricing.dpJumlah)}</span>
              </div>
              <div className="flex justify-between text-[#5F7A84] text-[11px]">
                <span>Sisa bayar saat serah terima</span>
                <span className="font-semibold text-[#234E5C]">{formatRupiah(pricing.sisaSaatAmbil)}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-extrabold text-[#234E5C] border-t border-[#E8E8E1] pt-3">
                <span>Total Keseluruhan</span>
                <span className="text-base text-[#A0630F] font-extrabold">{formatRupiah(pricing.totalKeseluruhan)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#5F7A84] pt-2 border-t border-[#E8E8E1]">
              <ShieldCheck className="h-4 w-4 text-[#234E5C] shrink-0" />
              <span>Jaminan unit terverifikasi & siap pakai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
