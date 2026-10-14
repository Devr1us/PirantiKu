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
import { H1, H2, H3, Lead, P, Eyebrow } from "@/components/ui/typography";
import { HoverRollText } from "@/components/ui/motion";
import { toast } from "sonner";
import { PaymentFlow } from "@/components/payment/payment-flow";
import type { Profile, Booking } from "@/types/database";

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
  const [qrisUrl, setQrisUrl] = React.useState<string>("");
  const [whatsappAdmin, setWhatsappAdmin] = React.useState<string>("6281234567890");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [createdBookingCode, setCreatedBookingCode] = React.useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = React.useState<Booking | null>(null);

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

        const { data: setList } = await supabase
          .from("settings")
          .select("key, value");

        if (setList) {
          setList.forEach((s) => {
            if (s.key === "rekening_bank" && s.value) setRekeningInfo(s.value);
            if (s.key === "qris_url" && s.value) setQrisUrl(s.value);
            if (s.key === "whatsapp_admin" && s.value) setWhatsappAdmin(s.value);
          });
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

      // Ambil data booking lengkap yang dibuat
      if (bookingId) {
        const { data: bData } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bData) {
          setCreatedBooking(bData as Booking);
          setCreatedBookingCode(bData.kode_booking);
        } else {
          setCreatedBookingCode(bookingId.slice(0, 8));
        }
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

  // Tampilan Sukses Checkout dengan Alur Pembayaran Lengkap
  if (currentStep === 3 && createdBookingCode) {
    const bookingForFlow = createdBooking || {
      id: createdBookingCode,
      kode_booking: createdBookingCode,
      status: "menunggu_dp" as const,
      total_harga: pricing.totalSewa,
      dp_jumlah: pricing.dpJumlah,
      deposit: pricing.totalDeposit,
      tanggal_mulai: startDate,
      tanggal_selesai: endDate,
      created_at: new Date().toISOString(),
      pesan_admin: null,
      catatan_penyewa: catatan || null,
    };

    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16 space-y-6 bg-[#FAFAF8] text-[#234E5C]">
        {/* Banner Sukses Terbuat */}
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <Eyebrow className="text-[#2E5E4E]">
              Langkah 3 Selesai: Pesanan Terdaftar
            </Eyebrow>
            <H1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#234E5C]">
              Booking Berhasil Dibuat!
            </H1>
            <p className="text-xs text-[#5F7A84]">
              Silakan selesaikan pembayaran uang muka (DP 30%) di bawah ini untuk mengunci unit Anda.
            </p>
          </div>
        </div>

        {/* Modul Alur Pembayaran Interaktif */}
        <PaymentFlow
          booking={bookingForFlow}
          customerName={profile?.nama || "Penyewa"}
          rekeningBank={rekeningInfo}
          qrisUrl={qrisUrl}
          whatsappAdmin={whatsappAdmin}
          showBackToHome={true}
        />
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
        <H1 className="section-title block pt-1">CHECKOUT PENYEWAAN</H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Konfirmasi data penyewa, tinjau ringkasan biaya, dan amankan pesanan unit alat Anda.
        </Lead>
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
                      Jadwal Booking Terpilih:
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
                    <li>Melunasi sisa biaya booking ({formatRupiah(pricing.sisaSaatAmbil)}) saat serah terima.</li>
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
          <div className="sticky top-[var(--navbar-offset)] transition-[top] duration-300 rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
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
                <span>Total Booking Alat</span>
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
