"use client";

import * as React from "react";
import {
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DailyIncomeChart } from "./daily-income-chart";

export interface FinanceSummaryData {
  totalPemasukan: number;
  dpMasuk: number;
  pelunasanMasuk: number;
  dendaDanGantiRugi: number;
  pendingShortfall?: number;
  totalDepositDitahan: number;
  refundDibayar: number;
  pendingVerifications: number;
  pendingRefunds?: number;
}

export interface DailyChartPoint {
  date: string;
  amount: number;
}

interface FinanceSummaryTabProps {
  onGoToVerification: () => void;
  onSummaryLoaded?: (data: FinanceSummaryData) => void;
}

export function FinanceSummaryTab({ onGoToVerification, onSummaryLoaded }: FinanceSummaryTabProps) {
  const [period, setPeriod] = React.useState<string>("bulan_ini");
  const [customStart, setCustomStart] = React.useState<string>("");
  const [customEnd, setCustomEnd] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [summary, setSummary] = React.useState<FinanceSummaryData>({
    totalPemasukan: 0,
    dpMasuk: 0,
    pelunasanMasuk: 0,
    dendaDanGantiRugi: 0,
    totalDepositDitahan: 0,
    refundDibayar: 0,
    pendingVerifications: 0,
  });
  const [chartData, setChartData] = React.useState<DailyChartPoint[]>([]);

  const fetchSummary = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/finance/summary?period=${period}`;
      if (period === "kustom" && customStart && customEnd) {
        url += `&start_date=${customStart}&end_date=${customEnd}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.summary) {
        setSummary(json.summary);
        onSummaryLoaded?.(json.summary);
      }
      if (json.chartData) {
        setChartData(json.chartData);
      }
    } catch (err) {
      console.error("Gagal memuat ringkasan keuangan:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, customStart, customEnd, onSummaryLoaded]);

  React.useEffect(() => {
    if (period === "kustom" && (!customStart || !customEnd)) {
      return;
    }
    fetchSummary();
  }, [period, customStart, customEnd, fetchSummary]);

  // Hitung rentang tanggal string (YYYY-MM-DD) untuk pengisian hari lengkap pada grafik
  const { chartDari, chartSampai } = React.useMemo(() => {
    const now = new Date();
    const wibStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const [y, m] = wibStr.split("-");

    if (period === "hari_ini") {
      return { chartDari: wibStr, chartSampai: wibStr };
    }
    if (period === "7_hari") {
      const [yearNum, monthNum, dayNum] = wibStr.split("-").map(Number);
      const currUtc = Date.UTC(yearNum, monthNum - 1, dayNum);
      const startUtc = currUtc - 6 * 24 * 60 * 60 * 1000;
      const d = new Date(startUtc);
      const startStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      return { chartDari: startStr, chartSampai: wibStr };
    }
    if (period === "bulan_ini") {
      // 1 sampai hari ini pada bulan berjalan
      return { chartDari: `${y}-${m}-01`, chartSampai: wibStr };
    }
    if (period === "kustom" && customStart && customEnd) {
      return { chartDari: customStart, chartSampai: customEnd };
    }
    return { chartDari: `${y}-${m}-01`, chartSampai: wibStr };
  }, [period, customStart, customEnd]);

  return (
    <div className="space-y-6">
      {/* Baris Filter Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#234E5C]">Filter Rentang Waktu</h2>
          <p className="text-xs text-[#5F7A84]">
            Pilih periode pembukuan untuk melihat akumulasi arus kas masuk dan keluar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "hari_ini", label: "Hari Ini" },
            { id: "7_hari", label: "7 Hari Terakhir" },
            { id: "bulan_ini", label: "Bulan Ini" },
            { id: "kustom", label: "Rentang Kustom" },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === btn.id
                  ? "bg-[#234E5C] text-white shadow-xs"
                  : "bg-[#FAFAF8] text-[#5F7A84] hover:bg-[#E8E8E1] border border-[#E8E8E1]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Tanggal Kustom */}
      {period === "kustom" && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F8F9FA] rounded-xl border border-[#E8E8E1]">
          <div className="flex items-center gap-2 text-xs text-[#234E5C] font-semibold">
            <span>Dari:</span>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-36 h-8 text-xs bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#234E5C] font-semibold">
            <span>Sampai:</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-36 h-8 text-xs bg-white"
            />
          </div>
          <Button
            size="sm"
            onClick={fetchSummary}
            className="h-8 text-xs bg-[#234E5C] text-white hover:bg-[#1a3b46]"
          >
            Terapkan Filter
          </Button>
        </div>
      )}

      {/* Notifikasi jika ada pembayaran antrean */}
      {summary.pendingVerifications > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F]">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#D97706] shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold">
                Terdapat {summary.pendingVerifications} pembayaran yang menunggu verifikasi Anda!
              </p>
              <p className="text-[11px] text-[#92400E]">
                Tinjau bukti transfer pelanggan untuk mempercepat jadwal persiapan dan serah terima alat.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onGoToVerification}
            className="text-xs bg-[#D97706] hover:bg-[#B45309] text-white font-bold"
          >
            Periksa Sekarang
          </Button>
        </div>
      )}

      {/* Kartu Metrik Ringkasan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Pemasukan Periode Ini */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Total Pemasukan
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#E2F0D9] text-[#2E5E4E] flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#234E5C]">
              {isLoading ? "..." : formatRupiah(summary.totalPemasukan)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Total pembayaran masuk terverifikasi pada periode ini.
          </p>
        </div>

        {/* 2. DP Masuk */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Uang Muka (DP)
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#0369A1]">
              {isLoading ? "..." : formatRupiah(summary.dpMasuk)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Uang muka booking terverifikasi.
          </p>
        </div>

        {/* 3. Pelunasan Sewa */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Pelunasan Sewa
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] text-[#5B21B6] flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#5B21B6]">
              {isLoading ? "..." : formatRupiah(summary.pelunasanMasuk)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Sisa sewa yang telah dibayarkan.
          </p>
        </div>

        {/* 4. Deposit Sedang Ditahan */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Deposit Ditahan
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#FEF3C7] text-[#78350F] flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#A0630F]">
              {isLoading ? "..." : formatRupiah(summary.totalDepositDitahan)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Uang jaminan aktif pada pesanan berjalan.
          </p>
        </div>

        {/* 5. Denda & Ganti Rugi */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Denda & Kerusakan
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#991B1B]">
              {isLoading ? "..." : formatRupiah(summary.dendaDanGantiRugi)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Kompensasi keterlambatan & unit rusak (lunas diterima).
          </p>
        </div>

        {/* 6. Refund Dibayarkan */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Refund Dibayarkan
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#475569]">
              {isLoading ? "..." : formatRupiah(summary.refundDibayar)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Pengembalian deposit yang telah ditransfer.
          </p>
        </div>

        {/* 7. Menunggu Verifikasi */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E8E1] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Antrean Verifikasi
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#FFFBEB] text-[#B45309] flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[#B45309]">
              {isLoading ? "..." : `${summary.pendingVerifications} Transaksi`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#5F7A84]">
            Memerlukan persetujuan admin.
          </p>
        </div>
      </div>

      {/* Grafik Pemasukan Harian */}
      <div className="p-5 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#A0630F]" />
              <span>Tren Pemasukan Harian</span>
            </h3>
            <p className="text-xs text-[#5F7A84]">
              Grafik persebaran nominal uang masuk per tanggal transaksi terverifikasi (WIB).
            </p>
          </div>
          <span className="text-xs font-semibold text-[#5F7A84]">
            Periode: <strong className="text-[#234E5C]">{period.replace("_", " ").toUpperCase()}</strong>
          </span>
        </div>

        <DailyIncomeChart
          data={chartData}
          dari={chartDari}
          sampai={chartSampai}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
