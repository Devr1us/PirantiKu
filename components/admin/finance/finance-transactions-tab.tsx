"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { PAYMENT_JENIS_LABELS } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TransactionRow {
  id: number;
  booking_id: string;
  jenis: string;
  arah: string;
  jumlah: number;
  metode: string;
  status: string;
  catatan?: string | null;
  created_at: string;
  booking?: {
    id: string;
    kode_booking: string;
    status: string;
    profile?: {
      id: string;
      nama: string;
      no_hp: string;
    } | null;
  } | null;
  admin?: {
    id: string;
    nama: string;
  } | null;
}

export function FinanceTransactionsTab() {
  const [transactions, setTransactions] = React.useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [search, setSearch] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");

  const [jenis, setJenis] = React.useState<string>("semua");
  const [arah, setArah] = React.useState<string>("semua");
  const [status, setStatus] = React.useState<string>("semua");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  const [page, setPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [totalCount, setTotalCount] = React.useState<number>(0);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (jenis !== "semua") params.set("jenis", jenis);
      if (arah !== "semua") params.set("arah", arah);
      if (status !== "semua") params.set("status", status);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`/api/admin/finance/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setTransactions(json.data);
      }
      if (json.pagination) {
        setTotalPages(json.pagination.totalPages || 1);
        setTotalCount(json.pagination.total || 0);
      }
    } catch (err) {
      console.error("Gagal memuat daftar transaksi:", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, jenis, arah, status, startDate, endDate, page]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Ekspor CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (jenis !== "semua") params.set("jenis", jenis);
    if (arah !== "semua") params.set("arah", arah);
    if (status !== "semua") params.set("status", status);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    params.set("export", "csv");

    window.open(`/api/admin/finance/transactions?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Kontrol Filter & Pencarian */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#234E5C]">Daftar Mutasi Transaksi (Buku Besar)</h2>
            <p className="text-xs text-[#5F7A84]">
              Seluruh riwayat uang masuk dan uang keluar yang tercatat dalam sistem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs border-[#E8E8E1] text-[#234E5C] font-semibold"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Ekspor CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
              disabled={isLoading}
              className="text-xs border-[#E8E8E1] text-[#234E5C]"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
          </div>
        </div>

        {/* Baris Input Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Pencarian */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F7A84]" />
            <Input
              type="text"
              placeholder="Cari kode booking, nama, catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-white h-9"
            />
          </div>

          {/* 2. Filter Jenis */}
          <div>
            <select
              value={jenis}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setJenis(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
            >
              <option value="semua">Semua Jenis</option>
              <option value="dp">Uang Muka (DP)</option>
              <option value="pelunasan">Pelunasan</option>
              <option value="deposit">Deposit Jaminan</option>
              <option value="denda">Denda Keterlambatan</option>
              <option value="ganti_rugi">Ganti Rugi</option>
              <option value="refund_deposit">Refund Deposit</option>
              <option value="penyesuaian">Penyesuaian</option>
            </select>
          </div>

          {/* 3. Filter Arah */}
          <div>
            <select
              value={arah}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setArah(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
            >
              <option value="semua">Semua Arah</option>
              <option value="masuk">Uang Masuk (In)</option>
              <option value="keluar">Uang Keluar (Out)</option>
            </select>
          </div>

          {/* 4. Filter Status */}
          <div>
            <select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatus(e.target.value); setPage(1); }}
              className="w-full h-9 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
            >
              <option value="semua">Semua Status</option>
              <option value="terverifikasi">Terverifikasi</option>
              <option value="menunggu_verifikasi">Menunggu</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          {/* 5. Filter Tanggal Mulai */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder="Dari Tanggal"
              className="text-xs h-9 bg-white"
            />
          </div>

          {/* 6. Filter Tanggal Akhir */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder="Sampai Tanggal"
              className="text-xs h-9 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-2xl border border-[#E8E8E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="bg-[#FAFAF8] text-[#5F7A84] uppercase font-bold border-b border-[#E8E8E1] text-[10px]">
              <tr>
                <th className="p-3.5">ID & Waktu</th>
                <th className="p-3.5">Booking & Pelanggan</th>
                <th className="p-3.5">Jenis Transaksi</th>
                <th className="p-3.5">Arah</th>
                <th className="p-3.5">Nominal (IDR)</th>
                <th className="p-3.5">Metode</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Catatan / Pencatat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#5F7A84]">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#5F7A84]">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const jenisLabel =
                    PAYMENT_JENIS_LABELS[tx.jenis as keyof typeof PAYMENT_JENIS_LABELS] || tx.jenis;
                  const isMasuk = tx.arah === "masuk" || (tx.jenis !== "refund_deposit" && !tx.arah);
                  return (
                    <tr key={tx.id} className="hover:bg-[#F8F9FA] transition-colors">
                      {/* ID & Waktu */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-[#5F7A84]">
                          #{tx.id}
                        </span>
                        <p className="text-[10px] text-[#5F7A84] mt-0.5">
                          {formatDateIndo(tx.created_at, "d MMM yyyy, HH:mm")}
                        </p>
                      </td>

                      {/* Booking & Pelanggan */}
                      <td className="p-3.5">
                        <Link
                          href={`/admin/booking?q=${tx.booking?.kode_booking}`}
                          className="font-bold text-[#234E5C] hover:underline"
                        >
                          #{tx.booking?.kode_booking || "-"}
                        </Link>
                        <p className="text-[11px] text-[#5F7A84] truncate max-w-[140px]">
                          {tx.booking?.profile?.nama || "Pelanggan"}
                        </p>
                      </td>

                      {/* Jenis Transaksi */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-semibold text-xs text-[#234E5C]">
                          {jenisLabel}
                        </span>
                      </td>

                      {/* Arah */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isMasuk
                              ? "bg-[#E2F0D9] text-[#2E5E4E]"
                              : "bg-[#FEE2E2] text-[#991B1B]"
                          }`}
                        >
                          {isMasuk ? (
                            <>
                              <ArrowDownRight className="h-3 w-3" />
                              Masuk
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="h-3 w-3" />
                              Keluar
                            </>
                          )}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`font-black text-xs ${
                            isMasuk ? "text-[#234E5C]" : "text-[#991B1B]"
                          }`}
                        >
                          {isMasuk ? "+" : "-"} {formatRupiah(tx.jumlah)}
                        </span>
                      </td>

                      {/* Metode */}
                      <td className="p-3.5 whitespace-nowrap text-[#5F7A84] text-[11px]">
                        {tx.metode}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === "terverifikasi"
                              ? "bg-[#E2F0D9] text-[#2E5E4E]"
                              : tx.status === "menunggu_verifikasi"
                              ? "bg-[#FEF3C7] text-[#78350F]"
                              : "bg-[#FEE2E2] text-[#991B1B]"
                          }`}
                        >
                          {tx.status === "terverifikasi"
                            ? "Terverifikasi"
                            : tx.status === "menunggu_verifikasi"
                            ? "Menunggu"
                            : "Ditolak"}
                        </span>
                      </td>

                      {/* Catatan / Pencatat */}
                      <td className="p-3.5 max-w-[200px]">
                        <p className="text-[11px] text-[#5F7A84] truncate">
                          {tx.catatan || "-"}
                        </p>
                        {tx.admin?.nama && (
                          <span className="text-[9px] text-[#A0630F] font-bold block mt-0.5">
                            Oleh: {tx.admin.nama}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3.5 border-t border-[#E8E8E1] text-xs text-[#5F7A84] bg-[#FAFAF8]">
          <span>
            Total: <strong>{totalCount}</strong> transaksi (Halaman {page} dari {totalPages})
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-bold text-[#234E5C]">{page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
