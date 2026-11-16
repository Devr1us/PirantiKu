"use client";

import * as React from "react";
import { CreditCard, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatRupiah } from "@/lib/format";
import { parseBankAccount } from "@/lib/payment-utils";

export interface PaymentMethodSelectorProps {
  selectedTab: "transfer" | "qris";
  onTabChange: (tab: "transfer" | "qris") => void;
  selectedBank: "bca" | "mandiri" | "bri" | "bni";
  onBankChange: (bank: "bca" | "mandiri" | "bri" | "bni") => void;
  dpAmount: number;
  rekeningBank?: string;
  qrisUrl?: string;
  bookingCode?: string;
  className?: string;
}

export function PaymentMethodSelector({
  selectedTab,
  onTabChange,
  selectedBank,
  onBankChange,
  dpAmount,
  rekeningBank = "BCA 1234567890 a/n PirantiKu",
  qrisUrl = "",
  bookingCode,
  className = "",
}: PaymentMethodSelectorProps) {
  const [isCopiedRek, setIsCopiedRek] = React.useState<boolean>(false);
  const [isCopiedNominal, setIsCopiedNominal] = React.useState<boolean>(false);

  const bcaInfo = React.useMemo(
    () => parseBankAccount(rekeningBank),
    [rekeningBank]
  );

  const bankOptions = React.useMemo(
    () => ({
      bca: {
        name: "Bank BCA",
        bank: "BCA",
        nomor: bcaInfo.nomor || "1234567890",
        atasNama: bcaInfo.atasNama || "PirantiKu",
        badge: "Utama",
        isDemo: false,
      },
      mandiri: {
        name: "Bank Mandiri",
        bank: "Mandiri",
        nomor: "108-000-1234567",
        atasNama: "PirantiKu (Demo)",
        badge: "Simulasi",
        isDemo: true,
      },
      bri: {
        name: "Bank BRI",
        bank: "BRI",
        nomor: "0123-01-012345-30-6",
        atasNama: "PirantiKu (Demo)",
        badge: "Simulasi",
        isDemo: true,
      },
      bni: {
        name: "Bank BNI",
        bank: "BNI",
        nomor: "0123456789",
        atasNama: "PirantiKu (Demo)",
        badge: "Simulasi",
        isDemo: true,
      },
    }),
    [bcaInfo]
  );

  const activeBank = bankOptions[selectedBank];

  const handleCopyRekening = async () => {
    try {
      await navigator.clipboard.writeText(activeBank.nomor.replace(/[^0-9]/g, ""));
      setIsCopiedRek(true);
      setTimeout(() => setIsCopiedRek(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyNominal = async () => {
    try {
      await navigator.clipboard.writeText(String(dpAmount));
      setIsCopiedNominal(true);
      setTimeout(() => setIsCopiedNominal(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-b border-[#E8E8E1] pb-3">
        <h3 className="text-base font-bold text-[#234E5C]">
          Pilihan Metode Pembayaran Uang Muka (DP)
        </h3>
        <p className="text-xs text-[#5F7A84] mt-0.5">
          Tersedia 2 metode transfer online resmi: Transfer Bank dan QRIS & E-Wallet
        </p>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={(val) => onTabChange(val as "transfer" | "qris")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full bg-[#F3F3EF] p-1 rounded-2xl gap-1">
          <TabsTrigger
            value="transfer"
            className="rounded-xl text-xs font-bold data-[state=active]:bg-[#234E5C] data-[state=active]:text-white flex items-center justify-center gap-1.5 py-2.5 transition-all"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Transfer Bank</span>
          </TabsTrigger>
          <TabsTrigger
            value="qris"
            className="rounded-xl text-xs font-bold data-[state=active]:bg-[#234E5C] data-[state=active]:text-white flex items-center justify-center gap-1.5 py-2.5 transition-all"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>QRIS & E-Wallet</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Transfer Bank (Multi-Bank) */}
        <TabsContent value="transfer" className="space-y-4 pt-2">
          {/* Pemilih Bank */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-[#5F7A84] mr-1">
              Pilih Bank Tujuan:
            </span>
            {(["bca", "mandiri", "bri", "bni"] as const).map((bKey) => {
              const b = bankOptions[bKey];
              const isSel = selectedBank === bKey;
              return (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => onBankChange(bKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    isSel
                      ? "bg-[#234E5C] text-white border-[#234E5C] shadow-xs"
                      : "bg-white text-[#234E5C] border-[#E8E8E1] hover:bg-[#FAFAF8]"
                  }`}
                >
                  {b.bank}
                </button>
              );
            })}
          </div>

          <div className="p-5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5F7A84] block">
                  Rekening Resmi PirantiKu
                </span>
                <h4 className="text-lg font-extrabold text-[#234E5C] mt-0.5">
                  {activeBank.name}
                </h4>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  activeBank.isDemo
                    ? "bg-[#FEF3C7] text-[#A0630F] border-[#FDE68A]"
                    : "bg-[#E2F0D9] text-[#2E5E4E] border-[#C5E1A5]"
                }`}
              >
                {activeBank.badge}
              </span>
            </div>

            {activeBank.isDemo && (
              <div className="rounded-lg bg-[#FEF3C7] border border-[#FDE68A] p-3 text-[11px] text-[#78350F]">
                <span className="font-bold block">⚠️ Akun Bank Demo / Simulasi</span>
                <span>
                  Rekening ini hanya untuk keperluan demo tampilan. Gunakan rekening BCA (Utama) untuk transaksi nyata.
                </span>
              </div>
            )}

            {/* Nomor Rekening */}
            <div className="p-4 rounded-xl bg-white border border-[#E8E8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-[#5F7A84] block font-medium">
                  Nomor Rekening Tujuan:
                </span>
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#234E5C] tracking-wider block">
                  {activeBank.nomor}
                </span>
                <span className="text-xs text-[#5F7A84] font-semibold block">
                  Atas Nama: {activeBank.atasNama}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyRekening}
                className="text-xs font-bold gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
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

            {/* Nominal DP */}
            <div className="p-4 rounded-xl bg-white border border-[#E8E8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-[#5F7A84] block font-medium">
                  Jumlah Uang Muka (DP 30%):
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#A0630F] block">
                  {formatRupiah(dpAmount)}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyNominal}
                className="text-xs font-bold gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                {isCopiedNominal ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#2E5E4E]" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Nominal</span>
                  </>
                )}
              </Button>
            </div>

            {/* Panduan Transfer */}
            <div className="rounded-lg bg-[#F3F3EF] p-3 text-[11px] text-[#5F7A84] space-y-1">
              <span className="font-bold text-[#234E5C] block">
                Panduan Transfer:
              </span>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Gunakan m-Banking atau ATM ke rekening {activeBank.name} di atas.</li>
                <li>
                  Pastikan nominal transfer tepat sebesar{" "}
                  <strong>{formatRupiah(dpAmount)}</strong>.
                </li>
                {bookingCode && (
                  <li>
                    Isi kolom berita/keterangan dengan kode booking:{" "}
                    <strong>{bookingCode}</strong>.
                  </li>
                )}
                <li>Simpan struk atau foto bukti transfer untuk diunggah pada tahap berikutnya (Tahap 3).</li>
              </ol>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: QRIS */}
        <TabsContent value="qris" className="space-y-4 pt-2">
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
                <div className="h-48 w-48 bg-[#F3F3EF] rounded-lg border border-[#E8E8E1] flex flex-col items-center justify-center p-3 relative">
                  <QrCode className="h-32 w-32 text-[#234E5C]" />
                  <span className="text-[10px] font-bold text-[#A0630F] mt-1">
                    PIRANTIKU KARANGANYAR
                  </span>
                </div>
              )}

              <div className="text-[11px] text-[#5F7A84] space-y-0.5">
                <p className="font-bold text-[#234E5C]">
                  NMID: {qrisUrl ? "ID1020PIRANTIKU" : "ID0000000000000 (Demo)"}
                </p>
                <p>Bebas biaya admin antar aplikasi e-Wallet</p>
              </div>
            </div>

            <div className="text-xs text-[#5F7A84] max-w-sm space-y-1">
              <p>
                Buka aplikasi <strong>BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay</strong>, pilih menu Scan QRIS, lalu masukkan nominal DP:
              </p>
              <p className="font-extrabold text-[#A0630F] text-base">
                {formatRupiah(dpAmount)}
              </p>
              <p className="text-[11px] text-[#5F7A84]">
                Simpan tangkapan layar bukti transfer untuk diunggah pada tahap berikutnya (Tahap 3).
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
