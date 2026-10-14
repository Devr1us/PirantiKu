"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  QrCode,
  Copy,
  Check,
  Clock,
  UploadCloud,
  FileCheck,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  ZoomIn,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import {
  compressImage,
  parseBankAccount,
  getPaymentCountdown,
  generateWhatsAppPaymentMessage,
} from "@/lib/payment-utils";
import type { BookingStatus, Payment } from "@/types/database";

export interface PaymentFlowProps {
  booking: {
    id: string;
    kode_booking: string;
    status: BookingStatus;
    total_harga: number;
    dp_jumlah: number;
    deposit: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    created_at: string;
    pesan_admin?: string | null;
    catatan_penyewa?: string | null;
  };
  customerName?: string;
  initialPayments?: Payment[];
  rekeningBank?: string;
  qrisUrl?: string;
  whatsappAdmin?: string;
  onPaymentSuccess?: () => void;
  showBackToHome?: boolean;
}

export function PaymentFlow({
  booking,
  customerName = "Penyewa",
  initialPayments = [],
  rekeningBank = "BCA 1234567890 a/n PirantiKu",
  qrisUrl = "",
  whatsappAdmin = "6281234567890",
  onPaymentSuccess,
  showBackToHome = false,
}: PaymentFlowProps) {
  const supabase = createClient();

  const [activeTab, setActiveTab] = React.useState<"transfer" | "qris">("transfer");
  const [payments, setPayments] = React.useState<Payment[]>(initialPayments);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [namaPengirim, setNamaPengirim] = React.useState<string>("");
  const [bankPengirim, setBankPengirim] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isCopiedRek, setIsCopiedRek] = React.useState<boolean>(false);
  const [isCopiedNominal, setIsCopiedNominal] = React.useState<boolean>(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = React.useState<boolean>(false);
  const [activeZoomImage, setActiveZoomImage] = React.useState<string | null>(null);
  const [isEditingProof, setIsEditingProof] = React.useState<boolean>(false);

  // Timer Countdown
  const [countdown, setCountdown] = React.useState(() =>
    getPaymentCountdown(booking.created_at, 24)
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getPaymentCountdown(booking.created_at, 24));
    }, 1000);
    return () => clearInterval(timer);
  }, [booking.created_at]);

  const bankInfo = React.useMemo(
    () => parseBankAccount(rekeningBank),
    [rekeningBank]
  );

  // Cari pembayaran DP terbaru
  const latestDpPayment = React.useMemo(() => {
    if (!payments || payments.length === 0) return null;
    return payments
      .filter((p) => p.jenis === "dp")
      .sort(
        (a, b) =>
          new Date(b.dibayar_pada).getTime() - new Date(a.dibayar_pada).getTime()
      )[0] || null;
  }, [payments]);

  // File selection & preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Mohon pilih file gambar (JPG, PNG, atau WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB.");
      return;
    }

    try {
      setUploadedFile(file);
      const compressedDataUrl = await compressImage(file);
      setPreviewUrl(compressedDataUrl);
      toast.success("Foto bukti transfer berhasil dipilih.");
    } catch {
      toast.error("Gagal memproses gambar bukti transfer.");
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Mohon pilih file gambar (JPG, PNG, atau WEBP).");
      return;
    }

    try {
      setUploadedFile(file);
      const compressedDataUrl = await compressImage(file);
      setPreviewUrl(compressedDataUrl);
      toast.success("Foto bukti transfer berhasil dipilih.");
    } catch {
      toast.error("Gagal memproses gambar bukti transfer.");
    }
  };

  const handleCopyRekening = async () => {
    try {
      await navigator.clipboard.writeText(bankInfo.nomor);
      setIsCopiedRek(true);
      toast.success("Nomor rekening berhasil disalin!");
      setTimeout(() => setIsCopiedRek(false), 2000);
    } catch {
      toast.error("Gagal menyalin nomor rekening.");
    }
  };

  const handleCopyNominal = async () => {
    try {
      await navigator.clipboard.writeText(booking.dp_jumlah.toString());
      setIsCopiedNominal(true);
      toast.success("Nominal DP berhasil disalin!");
      setTimeout(() => setIsCopiedNominal(false), 2000);
    } catch {
      toast.error("Gagal menyalin nominal.");
    }
  };

  // Submit Bukti Pembayaran
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewUrl) {
      toast.error("Silakan unggah foto bukti transfer terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalBuktiUrl = previewUrl;

      // Coba upload ke Supabase Storage jika memungkinkan
      if (uploadedFile) {
        try {
          const fileExt = uploadedFile.name.split(".").pop() || "jpg";
          const fileName = `dp_${booking.kode_booking}_${Date.now()}.${fileExt}`;
          const filePath = `${booking.id}/${fileName}`;

          const { data: storageData, error: storageErr } = await supabase.storage
            .from("payment-proofs")
            .upload(filePath, uploadedFile, {
              upsert: true,
              contentType: uploadedFile.type,
            });

          if (!storageErr && storageData) {
            const { data: pubUrl } = supabase.storage
              .from("payment-proofs")
              .getPublicUrl(filePath);
            if (pubUrl?.publicUrl) {
              finalBuktiUrl = pubUrl.publicUrl;
            }
          }
        } catch {
          // Fallback ke compressed base64 data URL
        }
      }

      const metodeLabel =
        activeTab === "transfer"
          ? `Transfer ${bankInfo.bank}${bankPengirim ? ` (${bankPengirim})` : ""}`
          : "QRIS / E-Wallet";

      const { data: newPayment, error: insertErr } = await supabase
        .from("payments")
        .insert({
          booking_id: booking.id,
          jenis: "dp",
          jumlah: booking.dp_jumlah,
          metode: metodeLabel,
          bukti_url: finalBuktiUrl,
          status: "menunggu_verifikasi",
          dibayar_pada: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error("Gagal menyimpan data pembayaran: " + insertErr.message);
      }

      if (newPayment) {
        setPayments((prev) => [newPayment as Payment, ...prev]);
      }

      setIsEditingProof(false);
      setUploadedFile(null);
      setPreviewUrl(null);
      toast.success("Bukti transfer berhasil dikirim ke admin!");
      onPaymentSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanWa = whatsappAdmin.replace(/[^0-9]/g, "");
  const waPaymentUrl = `https://wa.me/${cleanWa}?text=${generateWhatsAppPaymentMessage(
    {
      bookingCode: booking.kode_booking,
      customerName,
      dpAmount: booking.dp_jumlah,
      method: latestDpPayment?.metode || (activeTab === "transfer" ? bankInfo.bank : "QRIS"),
      senderName: namaPengirim,
      startDate: formatDateIndo(booking.tanggal_mulai, "d MMM yyyy"),
      endDate: formatDateIndo(booking.tanggal_selesai, "d MMM yyyy"),
    }
  )}`;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner Batas Waktu Pembayaran */}
      <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-4 text-xs text-[#78350F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 shrink-0 text-[#A0630F] animate-pulse" />
          <div>
            <span className="font-bold block text-sm sm:text-xs">
              Selesaikan Pembayaran Uang Muka (DP 30%)
            </span>
            <span className="text-[11px] text-[#78350F]/90">
              Unit alat diamankan setelah bukti transfer uang muka diverifikasi admin.
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-[#FDE68A] self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-[#5F7A84]">
            Batas Waktu:
          </span>
          <span
            className={`font-mono text-xs font-bold ${
              countdown.isExpired ? "text-[#DC2626]" : "text-[#A0630F]"
            }`}
          >
            {countdown.formatted}
          </span>
        </div>
      </div>

      {/* 2. Rincian Nominal Pembayaran DP */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Tagihan Uang Muka (DP 30%)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#A0630F]">
                {formatRupiah(booking.dp_jumlah)}
              </span>
              <button
                type="button"
                onClick={handleCopyNominal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#234E5C] hover:text-[#A0630F] underline cursor-pointer"
              >
                {isCopiedNominal ? (
                  <>
                    <Check className="h-3 w-3 text-[#2E5E4E]" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Salin Nominal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <span className="text-[#5F7A84] block text-[11px]">
              Kode Booking:
            </span>
            <span className="inline-block font-mono text-xs font-bold text-[#234E5C] px-2.5 py-1 rounded-md bg-[#F3F3EF] border border-[#E8E8E1]">
              {booking.kode_booking}
            </span>
          </div>
        </div>

        {/* Breakdown Singkat */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1]">
            <span className="text-[11px] text-[#5F7A84] block">Total Sewa Alat</span>
            <span className="font-bold text-[#234E5C]">
              {formatRupiah(booking.total_harga)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1]">
            <span className="text-[11px] text-[#5F7A84] block">Deposit Jaminan (Kembali)</span>
            <span className="font-bold text-[#234E5C]">
              {formatRupiah(booking.deposit)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#5F7A84] block">Pelunasan Saat Ambil</span>
            <span className="font-bold text-[#234E5C]">
              {formatRupiah(booking.total_harga - booking.dp_jumlah + booking.deposit)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Pembayaran Terkini Jika Sudah Ada */}
      {latestDpPayment && !isEditingProof && (
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
            <h3 className="text-sm font-bold text-[#234E5C]">
              Status Pembayaran DP
            </h3>
            <span className="text-xs text-[#5F7A84]">
              {formatDateIndo(latestDpPayment.dibayar_pada, "d MMM yyyy, HH:mm")} WIB
            </span>
          </div>

          {latestDpPayment.status === "menunggu_verifikasi" && (
            <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-4 text-xs text-[#78350F] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="h-4 w-4 text-[#A0630F]" />
                <span>Bukti Transfer Berhasil Terkirim (Menunggu Verifikasi)</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Admin PirantiKu sedang mencocokkan mutasi rekening Anda. Estimasi verifikasi adalah 15–30 menit pada jam operasional (08.00 - 20.00 WIB).
              </p>
            </div>
          )}

          {latestDpPayment.status === "terverifikasi" && (
            <div className="rounded-xl border border-[#C5E1A5] bg-[#E2F0D9] p-4 text-xs text-[#2E5E4E] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check className="h-4 w-4" />
                <span>Pembayaran DP Terverifikasi!</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Uang muka Anda telah diterima. Unit peralatan telah dijadwalkan dan dikunci untuk Anda. Silakan bawa KTP/SIM asli saat pengambilan alat.
              </p>
            </div>
          )}

          {latestDpPayment.status === "ditolak" && (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEE2E2] p-4 text-xs text-[#991B1B] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Bukti Transfer Ditolak</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                {booking.pesan_admin ||
                  "Nominal transfer atau foto bukti tidak sesuai. Silakan periksa kembali mutasi Anda dan unggah bukti transfer yang valid."}
              </p>
            </div>
          )}

          {/* Rincian Bukti yang Terunggah */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] text-xs">
            <div className="flex items-center gap-3">
              {latestDpPayment.bukti_url ? (
                <div
                  onClick={() => {
                    setActiveZoomImage(latestDpPayment.bukti_url);
                    setIsZoomModalOpen(true);
                  }}
                  className="relative h-14 w-14 rounded-lg overflow-hidden border border-[#E8E8E1] cursor-pointer group shrink-0"
                >
                  <img
                    src={latestDpPayment.bukti_url}
                    alt="Bukti Transfer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <ZoomIn className="h-4 w-4" />
                  </div>
                </div>
              ) : (
                <div className="h-14 w-14 rounded-lg bg-[#F3F3EF] flex items-center justify-center text-[#5F7A84] shrink-0">
                  <FileCheck className="h-6 w-6" />
                </div>
              )}

              <div>
                <span className="font-bold text-[#234E5C] block">
                  {latestDpPayment.metode}
                </span>
                <span className="text-[11px] text-[#5F7A84] block">
                  Jumlah: {formatRupiah(latestDpPayment.jumlah)}
                </span>
                {latestDpPayment.bukti_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveZoomImage(latestDpPayment.bukti_url);
                      setIsZoomModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#A0630F] hover:underline mt-0.5 inline-block cursor-pointer"
                  >
                    Buka Foto Bukti Transfer
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {latestDpPayment.status !== "terverifikasi" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProof(true)}
                  className="text-xs font-bold gap-1.5 flex-1 sm:flex-initial"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Unggah Ulang Bukti
                </Button>
              )}

              <a
                href={waPaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial"
              >
                <Button
                  type="button"
                  variant="warm"
                  size="sm"
                  className="text-xs font-bold gap-1.5 w-full"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat WhatsApp Admin
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab Pilihan Metode Pembayaran & Formulir Upload (Tampil jika belum ada bukti atau sedang edit) */}
      {(!latestDpPayment || isEditingProof || latestDpPayment.status === "ditolak") && (
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#234E5C]">
                Instruksi & Pilihan Pembayaran
              </h3>
              <p className="text-xs text-[#5F7A84] mt-0.5">
                Pilih metode transfer yang paling nyaman bagi Anda
              </p>
            </div>
            {isEditingProof && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingProof(false)}
                className="text-xs text-[#5F7A84]"
              >
                Batal
              </Button>
            )}
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "transfer" | "qris")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6 bg-[#F3F3EF] p-1 rounded-full">
              <TabsTrigger
                value="transfer"
                className="rounded-full text-xs font-bold data-[state=active]:bg-[#234E5C] data-[state=active]:text-white flex items-center gap-2 py-2"
              >
                <CreditCard className="h-4 w-4" />
                Transfer Bank Manual
              </TabsTrigger>
              <TabsTrigger
                value="qris"
                className="rounded-full text-xs font-bold data-[state=active]:bg-[#234E5C] data-[state=active]:text-white flex items-center gap-2 py-2"
              >
                <QrCode className="h-4 w-4" />
                QRIS (BCA, OVO, GoPay)
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Transfer Bank Manual */}
            <TabsContent value="transfer" className="space-y-4">
              <div className="p-5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5F7A84] block">
                      Rekening Resmi PirantiKu
                    </span>
                    <h4 className="text-lg font-extrabold text-[#234E5C] mt-0.5">
                      Bank {bankInfo.bank}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
                    Penerima Terverifikasi
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E8E8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-[#5F7A84] block font-medium">
                      Nomor Rekening Tujuan:
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#234E5C] tracking-wider block">
                      {bankInfo.nomor}
                    </span>
                    <span className="text-xs text-[#5F7A84] font-semibold block">
                      Atas Nama: {bankInfo.atasNama}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyRekening}
                    className="text-xs font-bold gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    {isCopiedRek ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#2E5E4E]" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Rekening</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg bg-[#F3F3EF] p-3 text-[11px] text-[#5F7A84] space-y-1">
                  <span className="font-bold text-[#234E5C] block">
                    Panduan Transfer:
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Gunakan m-Banking atau ATM ke rekening {bankInfo.bank} di atas.</li>
                    <li>
                      Pastikan nominal transfer tepat sebesar{" "}
                      <strong>{formatRupiah(booking.dp_jumlah)}</strong>.
                    </li>
                    <li>
                      Isi kolom berita/keterangan dengan kode booking:{" "}
                      <strong>{booking.kode_booking}</strong>.
                    </li>
                    <li>Simpan struk atau tangkapan layar bukti transfer untuk diunggah di bawah.</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: QRIS */}
            <TabsContent value="qris" className="space-y-4">
              <div className="p-5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] flex flex-col items-center text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5F7A84]">
                    QRIS Standar Pembayaran Nasional
                  </span>
                  <h4 className="text-base font-extrabold text-[#234E5C]">
                    Scan QRIS PirantiKu Rental
                  </h4>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-sm flex flex-col items-center space-y-3">
                  <div className="flex items-center justify-between w-48 border-b border-[#E8E8E1] pb-2">
                    <span className="font-extrabold text-xs tracking-tighter text-[#234E5C]">
                      QRIS
                    </span>
                    <span className="text-[9px] font-bold text-[#5F7A84]">
                      GPN / BI
                    </span>
                  </div>

                  {qrisUrl ? (
                    <div className="relative h-48 w-48 rounded-lg overflow-hidden border border-[#E8E8E1]">
                      <img
                        src={qrisUrl}
                        alt="QRIS PirantiKu"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    // Realistic Vector QR Code Presentation
                    <div className="h-48 w-48 bg-[#F3F3EF] rounded-lg border border-[#E8E8E1] flex flex-col items-center justify-center p-3 relative">
                      <QrCode className="h-32 w-32 text-[#234E5C]" />
                      <span className="text-[10px] font-bold text-[#A0630F] mt-1">
                        PIRANTIKU KARANGANYAR
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-[#5F7A84] space-y-0.5">
                    <p className="font-bold text-[#234E5C]">NMID: ID1020268899001</p>
                    <p>Bebas biaya admin antar aplikasi e-Wallet</p>
                  </div>
                </div>

                <div className="text-xs text-[#5F7A84] max-w-sm space-y-1">
                  <p>
                    Buka aplikasi <strong>BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay</strong>, atau m-Banking Anda, pilih menu Scan QRIS, dan masukkan nominal:
                  </p>
                  <p className="font-extrabold text-[#A0630F] text-base">
                    {formatRupiah(booking.dp_jumlah)}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* FORMULIR UNGGAH BUKTI TRANSFER */}
          <form onSubmit={handleSubmitPayment} className="space-y-5 border-t border-[#E8E8E1] pt-6">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#234E5C]">
                Unggah Bukti Pembayaran
              </h4>
              <p className="text-xs text-[#5F7A84]">
                Kirim foto struk transfer atau tangkapan layar m-Banking untuk mempercepat verifikasi unit.
              </p>
            </div>

            {/* Dropzone Upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                previewUrl
                  ? "border-[#2E5E4E] bg-[#E2F0D9]/20"
                  : "border-[#E8E8E1] hover:border-[#234E5C] bg-[#FAFAF8]"
              }`}
            >
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block max-w-xs mx-auto rounded-xl overflow-hidden border border-[#E8E8E1] shadow-sm">
                    <img
                      src={previewUrl}
                      alt="Preview Bukti"
                      className="max-h-56 w-auto object-contain mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                      title="Hapus foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-[#2E5E4E] flex items-center justify-center gap-1.5">
                    <Check className="h-4 w-4" />
                    Foto bukti transfer siap dikirim
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F3EF] text-[#234E5C] mx-auto">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="payment-file-upload"
                      className="text-xs font-bold text-[#A0630F] hover:underline cursor-pointer"
                    >
                      Klik untuk pilih foto struk
                    </label>
                    <span className="text-xs text-[#5F7A84]"> atau seret file ke sini</span>
                    <p className="text-[11px] text-[#5F7A84]">
                      Mendukung format JPG, PNG, WEBP (maks. 10MB)
                    </p>
                  </div>
                  <input
                    id="payment-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Field Informasi Pengirim (Opsional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="nama-pengirim" className="text-xs font-semibold text-[#5F7A84]">
                  Nama Pemilik Rekening / Pengirim (Opsional)
                </Label>
                <Input
                  id="nama-pengirim"
                  placeholder="Contoh: Budi Santoso"
                  value={namaPengirim}
                  onChange={(e) => setNamaPengirim(e.target.value)}
                  className="bg-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-pengirim" className="text-xs font-semibold text-[#5F7A84]">
                  Bank / E-Wallet Asal Transfer (Opsional)
                </Label>
                <Input
                  id="bank-pengirim"
                  placeholder="Contoh: BCA / Mandiri / GoPay"
                  value={bankPengirim}
                  onChange={(e) => setBankPengirim(e.target.value)}
                  className="bg-white text-xs"
                />
              </div>
            </div>

            {/* Tombol Aksi Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#5F7A84] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#2E5E4E]" />
                Verifikasi terenkripsi aman langsung ke pengelola
              </span>

              <Button
                type="submit"
                variant="warm"
                disabled={isSubmitting || !previewUrl}
                className="w-full sm:w-auto px-8 text-xs font-bold gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Mengirim Bukti...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Kirim Bukti Pembayaran</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Navigasi Tambahan */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
        <Link
          href="/booking-saya"
          className="text-[#234E5C] font-semibold hover:underline flex items-center gap-1"
        >
          &larr; Lihat Seluruh Booking Saya
        </Link>

        {showBackToHome && (
          <Link
            href="/alat"
            className="text-[#5F7A84] hover:text-[#234E5C] font-medium"
          >
            Kembali ke Katalog Alat
          </Link>
        )}
      </div>

      {/* MODAL LIGHTBOX FOTO BUKTI */}
      <Dialog open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#234E5C]">
              Foto Bukti Transfer Pembayaran DP
            </DialogTitle>
          </DialogHeader>
          {activeZoomImage && (
            <div className="mt-2 max-h-[75vh] overflow-auto rounded-xl border border-[#E8E8E1] flex items-center justify-center p-2 bg-[#F3F3EF]">
              <img
                src={activeZoomImage}
                alt="Bukti Transfer Penuh"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaymentFlow;
