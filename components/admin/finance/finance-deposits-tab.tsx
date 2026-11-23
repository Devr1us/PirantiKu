"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  RotateCcw,
  Search,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { compressImage } from "@/lib/payment-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DepositItem {
  bookingId: string;
  kodeBooking: string;
  pelanggan: string;
  noHp: string;
  bookingStatus: string;
  statusPembayaran: string;
  depositAwal: number;
  hariTerlambat: number;
  dendaKeterlambatan: number;
  gantiRugiKerusakan: number;
  totalPotongan: number;
  depositSisaSeharusnya: number;
  refundTelahDibayar: number;
  sisaPerluRefund: number;
  kekuranganBayar: number;
  statusDeposit: "ditahan" | "dikembalikan_penuh" | "dipotong_sebagian" | "dipotong_habis" | "kurang_bayar";
  createdAt: string;
}

export function FinanceDepositsTab() {
  const [items, setItems] = React.useState<DepositItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("semua");
  const [search, setSearch] = React.useState<string>("");

  // Modal Catat Refund
  const [selectedForRefund, setSelectedForRefund] = React.useState<DepositItem | null>(null);
  const [refundAmount, setRefundAmount] = React.useState<number>(0);
  const [refundMethod, setRefundMethod] = React.useState<string>("Transfer Bank");
  const [refundNotes, setRefundNotes] = React.useState<string>("");
  const [refundProofUrl, setRefundProofUrl] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const fetchDeposits = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "semua") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/finance/deposits?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat deposit:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // Buka Modal Refund
  const openRefundModal = (item: DepositItem) => {
    setSelectedForRefund(item);
    setRefundAmount(item.sisaPerluRefund > 0 ? item.sisaPerluRefund : item.depositSisaSeharusnya);
    setRefundMethod("Transfer Bank");
    setRefundNotes(`Pengembalian sisa deposit booking #${item.kodeBooking}`);
    setRefundProofUrl(null);
  };

  // Upload Bukti Transfer Refund
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.85);
      setRefundProofUrl(compressed);
      toast.success("Foto bukti transfer berhasil dimuat.");
    } catch {
      toast.error("Gagal memproses file foto.");
    }
  };

  // Submit Refund
  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRefund) return;

    if (refundAmount <= 0) {
      toast.error("Nominal refund harus lebih dari Rp 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/finance/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedForRefund.bookingId,
          jumlah: refundAmount,
          metode: refundMethod.trim(),
          buktiUrl: refundProofUrl,
          catatan: refundNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat refund.");

      toast.success(
        `Pengembalian deposit ${formatRupiah(refundAmount)} untuk booking #${selectedForRefund.kodeBooking} berhasil dicatat!`
      );
      setSelectedForRefund(null);
      fetchDeposits();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#A0630F]" />
              <span>Pelacakan Deposit & Pengembalian Jaminan</span>
            </h2>
            <p className="text-xs text-[#5F7A84]">
              Pantau status uang jaminan tiap booking: ditahan, dipotong denda/kerusakan, atau siap dikembalikan.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeposits}
            disabled={isLoading}
            className="text-xs border-[#E8E8E1] text-[#234E5C]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        </div>

        {/* Baris Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F7A84]" />
            <Input
              type="text"
              placeholder="Cari kode booking, nama penyewa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-white h-9"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
            >
              <option value="semua">Semua Status Deposit</option>
              <option value="ditahan">Ditahan (Booking Berjalan)</option>
              <option value="dipotong_sebagian">Dipotong Sebagian</option>
              <option value="dipotong_habis">Dipotong Habis</option>
              <option value="dikembalikan_penuh">Dikembalikan Penuh</option>
              <option value="kurang_bayar">Kurang Bayar (Kerusakan &gt; Deposit)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Deposit */}
      <div className="bg-white rounded-2xl border border-[#E8E8E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="bg-[#FAFAF8] text-[#5F7A84] uppercase font-bold border-b border-[#E8E8E1] text-[10px]">
              <tr>
                <th className="p-3.5">Booking</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Deposit Awal</th>
                <th className="p-3.5">Potongan Denda & Kerusakan</th>
                <th className="p-3.5">Sisa Hak Deposit</th>
                <th className="p-3.5">Telah Direfund</th>
                <th className="p-3.5">Status Deposit</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#5F7A84]">
                    Memuat data deposit...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#5F7A84]">
                    Tidak ada catatan deposit yang cocok.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const hasRemainingRefund = row.sisaPerluRefund > 0;
                  return (
                    <tr key={row.bookingId} className="hover:bg-[#F8F9FA] transition-colors">
                      {/* Booking */}
                      <td className="p-3.5">
                        <Link
                          href={`/admin/booking?q=${row.kodeBooking}`}
                          className="font-bold text-[#234E5C] hover:underline"
                        >
                          #{row.kodeBooking}
                        </Link>
                        <p className="text-[10px] text-[#5F7A84] mt-0.5">
                          Status: <strong className="capitalize">{row.bookingStatus.replace("_", " ")}</strong>
                        </p>
                      </td>

                      {/* Pelanggan */}
                      <td className="p-3.5">
                        <span className="font-semibold text-[#234E5C]">{row.pelanggan}</span>
                        <p className="text-[10px] text-[#5F7A84]">{row.noHp}</p>
                      </td>

                      {/* Deposit Awal */}
                      <td className="p-3.5 whitespace-nowrap font-bold text-[#234E5C]">
                        {formatRupiah(row.depositAwal)}
                      </td>

                      {/* Potongan */}
                      <td className="p-3.5 whitespace-nowrap">
                        {row.totalPotongan > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#991B1B]">
                              - {formatRupiah(row.totalPotongan)}
                            </span>
                            <p className="text-[10px] text-[#5F7A84]">
                              {row.hariTerlambat > 0 && `Telat ${row.hariTerlambat} hr (${formatRupiah(row.dendaKeterlambatan)})`}
                              {row.gantiRugiKerusakan > 0 && ` | Kerusakan: ${formatRupiah(row.gantiRugiKerusakan)}`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[#5F7A84]">Rp 0 (Unit aman & tepat waktu)</span>
                        )}
                      </td>

                      {/* Sisa Hak Deposit */}
                      <td className="p-3.5 whitespace-nowrap font-black text-[#234E5C]">
                        {formatRupiah(row.depositSisaSeharusnya)}
                      </td>

                      {/* Telah Direfund */}
                      <td className="p-3.5 whitespace-nowrap font-semibold text-[#5F7A84]">
                        {formatRupiah(row.refundTelahDibayar)}
                      </td>

                      {/* Status Deposit */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.statusDeposit === "dikembalikan_penuh"
                              ? "bg-[#E2F0D9] text-[#2E5E4E]"
                              : row.statusDeposit === "dipotong_sebagian"
                              ? "bg-[#E0F2FE] text-[#0369A1]"
                              : row.statusDeposit === "dipotong_habis"
                              ? "bg-[#FEE2E2] text-[#991B1B]"
                              : row.statusDeposit === "kurang_bayar"
                              ? "bg-[#FEF3C7] text-[#78350F]"
                              : "bg-[#FFFBEB] text-[#A0630F]"
                          }`}
                        >
                          {row.statusDeposit === "dikembalikan_penuh"
                            ? "Dikembalikan Penuh"
                            : row.statusDeposit === "dipotong_sebagian"
                            ? "Dipotong Sebagian"
                            : row.statusDeposit === "dipotong_habis"
                            ? "Dipotong Habis"
                            : row.statusDeposit === "kurang_bayar"
                            ? "Kurang Bayar Kerusakan"
                            : "Ditahan (Aktif)"}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {hasRemainingRefund ? (
                          <Button
                            size="sm"
                            onClick={() => openRefundModal(row)}
                            className="text-xs bg-[#A0630F] hover:bg-[#834f0a] text-white font-bold h-7"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                            Catat Refund ({formatRupiah(row.sisaPerluRefund)})
                          </Button>
                        ) : row.statusDeposit === "dikembalikan_penuh" || row.statusDeposit === "dipotong_habis" ? (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Tuntas
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRefundModal(row)}
                            className="text-xs border-[#E8E8E1] text-[#234E5C] h-7"
                          >
                            Refund Manual
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Catat Refund Deposit */}
      <Dialog
        open={Boolean(selectedForRefund)}
        onOpenChange={() => !isSubmitting && setSelectedForRefund(null)}
      >
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[#A0630F]" />
              <span>Catat Pengembalian (Refund) Deposit</span>
            </DialogTitle>
          </DialogHeader>

          {selectedForRefund && (
            <form onSubmit={handleSubmitRefund} className="space-y-4 pt-2 text-xs text-[#234E5C]">
              {/* Ringkasan Booking */}
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8E8E1] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Kode Booking:</span>
                  <span className="font-bold">#{selectedForRefund.kodeBooking}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Pelanggan:</span>
                  <span className="font-semibold">{selectedForRefund.pelanggan} ({selectedForRefund.noHp})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Sisa Deposit Perlu Direfund:</span>
                  <span className="font-black text-[#A0630F]">
                    {formatRupiah(selectedForRefund.sisaPerluRefund)}
                  </span>
                </div>
              </div>

              {/* Input Nominal */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Nominal Transfer Refund (Rp) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  required
                  className="text-xs bg-white h-9"
                />
              </div>

              {/* Input Metode */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Metode Pengembalian</Label>
                <Input
                  type="text"
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  placeholder="Contoh: Transfer BCA, Transfer Seabank, Tunai"
                  required
                  className="text-xs bg-white h-9"
                />
              </div>

              {/* Input Bukti Transfer */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Upload Foto Bukti Transfer (Opsional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProofUpload}
                  className="text-xs bg-white"
                />
                {refundProofUrl && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Foto bukti berhasil dimuat dan dikompresi.
                  </p>
                )}
              </div>

              {/* Input Catatan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Catatan Pembukuan</Label>
                <textarea
                  value={refundNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRefundNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-[#E8E8E1] bg-white text-xs text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
                />
              </div>

              <DialogFooter className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setSelectedForRefund(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Transaksi Refund"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
