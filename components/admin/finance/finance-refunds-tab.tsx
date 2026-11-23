"use client";

import * as React from "react";
import Link from "next/link";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Search,
  Copy,
  Check,
  UploadCloud,
  X,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah, formatDateIndo } from "@/lib/format";
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

interface RefundItem {
  id: number;
  booking_id: string;
  jenis: "refund_deposit" | "refund_pembayaran" | string;
  arah: string;
  jumlah: number;
  metode: string;
  status: "menunggu_transfer" | "terverifikasi" | string;
  bukti_url: string | null;
  catatan: string | null;
  dibayar_pada: string;
  created_at: string;
  bank_pengirim?: string | null;
  no_rekening_pengirim?: string | null;
  atas_nama_pengirim?: string | null;
  rekening_pengirim?: {
    bank?: string;
    nomor?: string;
    atas_nama?: string;
  } | null;
  booking?: {
    id: string;
    kode_booking: string;
    status: string;
    user_id: string;
    profile?: {
      id: string;
      nama: string;
      no_hp: string;
    } | null;
  } | null;
}

interface FinanceRefundsTabProps {
  onActionSuccess?: () => void;
}

export function FinanceRefundsTab({ onActionSuccess }: FinanceRefundsTabProps) {
  const [refunds, setRefunds] = React.useState<RefundItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("menunggu_transfer");
  const [search, setSearch] = React.useState<string>("");
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  // Modal Transfer
  const [selectedRefund, setSelectedRefund] = React.useState<RefundItem | null>(null);
  const [proofUrl, setProofUrl] = React.useState<string | null>(null);
  const [catatan, setCatatan] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Modal Zoom Bukti
  const [zoomProofUrl, setZoomProofUrl] = React.useState<string | null>(null);

  const fetchRefunds = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/refund?status=${statusFilter}`);
      const json = await res.json();
      if (json.data) {
        setRefunds(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat antrean refund:", err);
      toast.error("Gagal memuat antrean refund.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Nomor rekening berhasil disalin.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 900, 0.85);
      setProofUrl(compressed);
      toast.success("Foto bukti transfer berhasil dimuat.");
    } catch {
      toast.error("Gagal memproses file foto.");
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/finance/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedRefund.id,
          buktiUrl: proofUrl,
          catatan: catatan.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyelesaikan refund.");

      toast.success(
        `Refund Rp ${Number(selectedRefund.jumlah).toLocaleString("id-ID")} berhasil ditandai telah ditransfer!`
      );
      setSelectedRefund(null);
      setProofUrl(null);
      setCatatan("");
      fetchRefunds();
      onActionSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const kode = r.booking?.kode_booking?.toLowerCase() || "";
    const nama = r.booking?.profile?.nama?.toLowerCase() || "";
    const hp = r.booking?.profile?.no_hp?.toLowerCase() || "";
    const rek = `${r.bank_pengirim || ""} ${r.no_rekening_pengirim || ""} ${r.atas_nama_pengirim || ""}`.toLowerCase();
    return kode.includes(q) || nama.includes(q) || hp.includes(q) || rek.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8E8E1] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#A0630F]" />
              <span>Antrean Pengembalian Dana (Refund Queue)</span>
            </h2>
            <p className="text-xs text-[#5F7A84]">
              Daftar dana yang harus ditransfer kembali ke rekening pelanggan karena sisa deposit jaminan atau pesanan batal otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRefunds}
              disabled={isLoading}
              className="text-xs border-[#E8E8E1] text-[#234E5C]"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {[
              { id: "menunggu_transfer", label: "Menunggu Transfer" },
              { id: "terverifikasi", label: "Sudah Ditransfer" },
              { id: "semua", label: "Semua Status" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === btn.id
                    ? "bg-[#234E5C] text-white shadow-xs"
                    : "bg-[#FAFAF8] text-[#5F7A84] hover:bg-[#E8E8E1] border border-[#E8E8E1]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F7A84]" />
            <Input
              type="text"
              placeholder="Cari kode booking, nama, rekening..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-white h-9"
            />
          </div>
        </div>
      </div>

      {/* Tabel Antrean Refund */}
      <div className="bg-white rounded-2xl border border-[#E8E8E1] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#5F7A84]">
            Memuat daftar antrean refund...
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5F7A84] space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-sm text-[#234E5C]">Tidak ada antrean refund!</p>
            <p>Seluruh kewajiban transfer pengembalian dana telah selesai diproses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] font-bold text-[#5F7A84] uppercase tracking-wider">
                  <th className="p-3.5">Booking & Pelanggan</th>
                  <th className="p-3.5">Jenis Refund</th>
                  <th className="p-3.5">Nominal Refund</th>
                  <th className="p-3.5">Rekening Tujuan Transfer</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E1]">
                {filteredRefunds.map((item) => {
                  const bankName =
                    item.bank_pengirim || item.rekening_pengirim?.bank || null;
                  const accNumber =
                    item.no_rekening_pengirim || item.rekening_pengirim?.nomor || null;
                  const accHolder =
                    item.atas_nama_pengirim || item.rekening_pengirim?.atas_nama || null;
                  const hasBankDetails = Boolean(bankName && accNumber);

                  const isPending = item.status === "menunggu_transfer";

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAF8]/80 transition-colors">
                      {/* Booking & Pelanggan */}
                      <td className="p-3.5">
                        <Link
                          href={`/admin/booking?q=${item.booking?.kode_booking}`}
                          className="font-bold text-[#234E5C] hover:underline flex items-center gap-1"
                        >
                          <span>#{item.booking?.kode_booking || "-"}</span>
                          <ExternalLink className="h-3 w-3 text-[#5F7A84]" />
                        </Link>
                        <p className="text-[11px] text-[#234E5C] font-semibold mt-0.5">
                          {item.booking?.profile?.nama || "Pelanggan"}
                        </p>
                        <p className="text-[10px] text-[#5F7A84]">
                          {item.booking?.profile?.no_hp || "-"}
                        </p>
                      </td>

                      {/* Jenis Refund */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.jenis === "refund_pembayaran"
                              ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                              : "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]"
                          }`}
                        >
                          {item.jenis === "refund_pembayaran"
                            ? "Refund Pembatalan (24 Jam)"
                            : "Refund Sisa Deposit"}
                        </span>
                      </td>

                      {/* Nominal Refund */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-sm font-black text-[#DC2626]">
                          {formatRupiah(item.jumlah)}
                        </span>
                      </td>

                      {/* Rekening Tujuan */}
                      <td className="p-3.5 max-w-[220px]">
                        {hasBankDetails ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#234E5C] block">
                              {bankName}
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#234E5C]">
                              <span>{accNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(accNumber!, item.id)}
                                title="Salin nomor rekening"
                                className="text-[#5F7A84] hover:text-[#234E5C]"
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-[#5F7A84] block truncate">
                              a/n {accHolder || "-"}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#991B1B] text-[10px] font-bold">
                              <AlertCircle className="h-3 w-3" />
                              Data rekening belum ada
                            </span>
                            {item.booking?.profile?.no_hp && (
                              <a
                                href={`https://wa.me/${item.booking.profile.no_hp.replace(/\D/g, "")}?text=${encodeURIComponent(
                                  `Halo Kak ${item.booking.profile.nama || ""}, kami dari PirantiKu ingin memproses pengembalian dana refund untuk booking #${item.booking?.kode_booking || ""}. Mohon infokan nama bank, nomor rekening, dan atas nama rekening Anda. Terima kasih!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#2E5E4E] font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Hubungi via WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPending
                              ? "bg-[#FEF3C7] text-[#78350F]"
                              : "bg-[#E2F0D9] text-[#2E5E4E]"
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Clock className="h-3 w-3 animate-pulse text-[#D97706]" />
                              Perlu Transfer
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Sudah Ditransfer
                            </>
                          )}
                        </span>
                      </td>

                      {/* Tanggal */}
                      <td className="p-3.5 whitespace-nowrap text-[#5F7A84] text-[11px]">
                        {formatDateIndo(item.created_at, "d MMM yyyy, HH:mm")} WIB
                      </td>

                      {/* Aksi */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(item);
                              setProofUrl(null);
                              setCatatan("");
                            }}
                            className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold h-8"
                          >
                            Tandai Sudah Ditransfer
                          </Button>
                        ) : item.bukti_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoomProofUrl(item.bukti_url)}
                            className="text-xs h-8 text-[#234E5C] border-[#E8E8E1]"
                          >
                            Lihat Bukti Transfer
                          </Button>
                        ) : (
                          <span className="text-[11px] text-[#5F7A84] italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tandai Sudah Ditransfer */}
      <Dialog open={Boolean(selectedRefund)} onOpenChange={(open) => !open && setSelectedRefund(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#A0630F]" />
              <span>Konfirmasi Transfer Pengembalian Dana</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRefund && (
            <form onSubmit={handleSubmitTransfer} className="space-y-4 pt-2">
              <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#E8E8E1] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Booking:</span>
                  <span className="font-bold text-[#234E5C]">#{selectedRefund.booking?.kode_booking}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Pelanggan:</span>
                  <span className="font-bold text-[#234E5C]">{selectedRefund.booking?.profile?.nama}</span>
                </div>
                <div className="flex justify-between border-t border-[#E8E8E1] pt-2">
                  <span className="text-[#5F7A84]">Nominal Transfer:</span>
                  <span className="font-black text-sm text-[#DC2626]">
                    {formatRupiah(selectedRefund.jumlah)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F7A84]">Rekening Tujuan:</span>
                  <span className="font-mono font-bold text-[#234E5C]">
                    {selectedRefund.bank_pengirim || selectedRefund.rekening_pengirim?.bank || "-"} -{" "}
                    {selectedRefund.no_rekening_pengirim || selectedRefund.rekening_pengirim?.nomor || "-"} (a/n{" "}
                    {selectedRefund.atas_nama_pengirim || selectedRefund.rekening_pengirim?.atas_nama || "-"})
                  </span>
                </div>
              </div>

              {/* Upload Foto Bukti Transfer Bank */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#234E5C]">
                  Unggah Bukti Transfer Admin (Opsional)
                </Label>
                {proofUrl ? (
                  <div className="relative inline-block w-full rounded-xl overflow-hidden border border-[#E8E8E1]">
                    <img src={proofUrl} alt="Bukti Transfer" className="h-40 w-full object-contain bg-[#FAFAF8]" />
                    <button
                      type="button"
                      onClick={() => setProofUrl(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#E8E8E1] hover:border-[#234E5C] rounded-xl p-4 text-center bg-white cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-6 w-6 text-[#5F7A84] mx-auto mb-1" />
                    <p className="text-xs font-semibold text-[#A0630F]">Pilih foto struk / tangkapan layar m-Banking</p>
                    <p className="text-[10px] text-[#5F7A84]">Maksimal 5MB, format JPG atau PNG</p>
                  </div>
                )}
              </div>

              {/* Catatan / No Referensi */}
              <div className="space-y-1.5">
                <Label htmlFor="catatan-refund" className="text-xs font-semibold text-[#234E5C]">
                  Catatan / No. Referensi Transfer (Opsional)
                </Label>
                <Input
                  id="catatan-refund"
                  placeholder="Contoh: Ref No 987123 via BCA KlikBCA"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRefund(null)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs bg-[#234E5C] hover:bg-[#1a3b46] text-white font-bold"
                >
                  {isSubmitting ? "Menyimpan..." : "Konfirmasi Telah Ditransfer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Zoom Bukti Transfer */}
      <Dialog open={Boolean(zoomProofUrl)} onOpenChange={(open) => !open && setZoomProofUrl(null)}>
        <DialogContent className="max-w-lg bg-white p-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#234E5C]">Bukti Transfer Pengembalian Dana</DialogTitle>
          </DialogHeader>
          {zoomProofUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-[#E8E8E1] bg-black/5">
              <img src={zoomProofUrl} alt="Bukti Transfer Refund" className="w-full h-auto max-h-[70vh] object-contain mx-auto" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
