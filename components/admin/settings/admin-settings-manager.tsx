"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CreditCard,
  QrCode,
  Phone,
  Clock,
  MapPin,
  Save,
  RotateCcw,
  ExternalLink,
  Upload,
  CheckCircle2,
  Building,
  DollarSign,
  Compass,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/format";
import { DEFAULT_SETTINGS, LOKASI_DEFAULT } from "@/lib/constants";
import { compressImage } from "@/lib/payment-utils";
import { toast } from "sonner";

export interface SettingsMap {
  [key: string]: string;
}

interface AdminSettingsManagerProps {
  initialSettings: SettingsMap;
}

type TabType = "pembayaran" | "kontak" | "lokasi";

export function AdminSettingsManager({
  initialSettings,
}: AdminSettingsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabType>("pembayaran");
  const [isSaving, setIsSaving] = React.useState(false);

  // Parse existing rekening_bank into bank, no_rek, and atas_nama for friendlier editing
  const initialRekening = initialSettings.rekening_bank || DEFAULT_SETTINGS.rekening_bank;
  const rekMatch = initialRekening.match(/^([A-Za-z0-9\s]+?)\s+(\d+)\s+a\/n\s+(.+)$/i);
  
  const [bankName, setBankName] = React.useState(rekMatch ? rekMatch[1] : "BCA");
  const [bankNumber, setBankNumber] = React.useState(rekMatch ? rekMatch[2] : "1234567890");
  const [bankHolder, setBankHolder] = React.useState(rekMatch ? rekMatch[3] : "PirantiKu");

  // Other settings states
  const [qrisUrl, setQrisUrl] = React.useState(initialSettings.qris_url || DEFAULT_SETTINGS.qris_url);
  const [dpPersen, setDpPersen] = React.useState(
    initialSettings.dp_persen || String(DEFAULT_SETTINGS.dp_persen)
  );
  const [dendaPerHari, setDendaPerHari] = React.useState(
    initialSettings.denda_per_hari || String(DEFAULT_SETTINGS.denda_per_hari)
  );
  const [whatsappAdmin, setWhatsappAdmin] = React.useState(
    initialSettings.whatsapp_admin || DEFAULT_SETTINGS.whatsapp_admin
  );
  const [jamOperasional, setJamOperasional] = React.useState(
    initialSettings.jam_operasional || DEFAULT_SETTINGS.jam_operasional
  );
  const [alamat, setAlamat] = React.useState(
    initialSettings.alamat || LOKASI_DEFAULT.alamat
  );
  const [lokasiLat, setLokasiLat] = React.useState(
    initialSettings.lokasi_lat || String(LOKASI_DEFAULT.lat)
  );
  const [lokasiLng, setLokasiLng] = React.useState(
    initialSettings.lokasi_lng || String(LOKASI_DEFAULT.lng)
  );
  const [mapsEmbedUrl, setMapsEmbedUrl] = React.useState(
    initialSettings.maps_embed_url || DEFAULT_SETTINGS.maps_embed_url
  );

  const [isUploadingQris, setIsUploadingQris] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle QRIS image upload & client-side compression
  const handleQrisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, atau WebP)");
      return;
    }

    setIsUploadingQris(true);
    try {
      const compressedDataUrl = await compressImage(file, 800, 0.85);
      setQrisUrl(compressedDataUrl);
      toast.success("Gambar QRIS berhasil dimuat & dikompresi.");
    } catch (err) {
      console.error("Gagal memproses gambar QRIS:", err);
      toast.error("Gagal memproses file gambar QRIS.");
    } finally {
      setIsUploadingQris(false);
    }
  };

  // Simpan seluruh pengaturan ke database
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();

      const combinedRekening = `${bankName.trim()} ${bankNumber.trim()} a/n ${bankHolder.trim()}`;

      const settingsToUpsert = [
        {
          key: "rekening_bank",
          value: combinedRekening,
          deskripsi: "Nomor rekening bank tujuan transfer penyewa",
        },
        {
          key: "qris_url",
          value: qrisUrl.trim(),
          deskripsi: "URL atau data gambar QRIS pembayaran",
        },
        {
          key: "dp_persen",
          value: String(Math.max(1, Math.min(100, parseInt(dpPersen, 10) || 30))),
          deskripsi: "Persentase uang muka DP pemesanan",
        },
        {
          key: "denda_per_hari",
          value: String(Math.max(0, parseInt(dendaPerHari, 10) || 50000)),
          deskripsi: "Nominal denda keterlambatan per hari (Rp)",
        },
        {
          key: "whatsapp_admin",
          value: whatsappAdmin.replace(/\D/g, ""),
          deskripsi: "Nomor WhatsApp admin aktif untuk konfirmasi",
        },
        {
          key: "jam_operasional",
          value: jamOperasional.trim(),
          deskripsi: "Informasi jam buka operasional toko",
        },
        {
          key: "alamat",
          value: alamat.trim(),
          deskripsi: "Alamat fisik toko / lokasi pengambilan alat",
        },
        {
          key: "lokasi_lat",
          value: String(parseFloat(lokasiLat) || LOKASI_DEFAULT.lat),
          deskripsi: "Koordinat latitude toko",
        },
        {
          key: "lokasi_lng",
          value: String(parseFloat(lokasiLng) || LOKASI_DEFAULT.lng),
          deskripsi: "Koordinat longitude toko",
        },
        {
          key: "maps_embed_url",
          value: mapsEmbedUrl.trim(),
          deskripsi: "URL embed peta Google Maps",
        },
      ];

      const { error } = await supabase
        .from("settings")
        .upsert(settingsToUpsert, { onConflict: "key" });

      if (error) {
        throw error;
      }

      toast.success("Pengaturan toko berhasil disimpan ke database!");
      router.refresh();
    } catch (err: unknown) {
      console.error("Gagal menyimpan pengaturan:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal menyimpan pengaturan: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset ke nilai default bawaan sistem
  const handleReset = () => {
    if (!confirm("Kembalikan semua nilai ke pengaturan default bawaan sistem?")) {
      return;
    }

    const rekMatchDef = DEFAULT_SETTINGS.rekening_bank.match(
      /^([A-Za-z0-9\s]+?)\s+(\d+)\s+a\/n\s+(.+)$/i
    );
    setBankName(rekMatchDef ? rekMatchDef[1] : "BCA");
    setBankNumber(rekMatchDef ? rekMatchDef[2] : "1234567890");
    setBankHolder(rekMatchDef ? rekMatchDef[3] : "PirantiKu");

    setQrisUrl(DEFAULT_SETTINGS.qris_url);
    setDpPersen(String(DEFAULT_SETTINGS.dp_persen));
    setDendaPerHari(String(DEFAULT_SETTINGS.denda_per_hari));
    setWhatsappAdmin(DEFAULT_SETTINGS.whatsapp_admin);
    setJamOperasional(DEFAULT_SETTINGS.jam_operasional);
    setAlamat(LOKASI_DEFAULT.alamat);
    setLokasiLat(String(LOKASI_DEFAULT.lat));
    setLokasiLng(String(LOKASI_DEFAULT.lng));
    setMapsEmbedUrl(DEFAULT_SETTINGS.maps_embed_url);

    toast.info("Nilai formulir telah direset ke default. Klik 'Simpan Perubahan' untuk menerapkan ke database.");
  };

  // Preview link WA admin
  const waClean = whatsappAdmin.replace(/\D/g, "");
  const waTestUrl = `https://wa.me/${waClean}?text=${encodeURIComponent(
    "Halo Admin PirantiKu, ini adalah uji coba pesan kontak."
  )}`;

  // Preview Google Maps URL
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lokasiLat},${lokasiLng}`;

  return (
    <div className="space-y-8">
      {/* Tombol Navigasi Tab */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E8E1] pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("pembayaran")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "pembayaran"
                ? "bg-[#234E5C] text-white shadow-xs"
                : "bg-white text-[#5F7A84] border border-[#E8E8E1] hover:text-[#234E5C] hover:bg-[#FAFAF8]"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Rekening & Pembayaran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kontak")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "kontak"
                ? "bg-[#234E5C] text-white shadow-xs"
                : "bg-white text-[#5F7A84] border border-[#E8E8E1] hover:text-[#234E5C] hover:bg-[#FAFAF8]"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Kontak & Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lokasi")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "lokasi"
                ? "bg-[#234E5C] text-white shadow-xs"
                : "bg-white text-[#5F7A84] border border-[#E8E8E1] hover:text-[#234E5C] hover:bg-[#FAFAF8]"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Alamat & Lokasi Toko</span>
          </button>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="text-xs text-[#5F7A84] border-[#E8E8E1] hover:text-[#234E5C]"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Default
          </Button>
          <Button
            type="button"
            variant="warm"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs shadow-sm font-bold"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      {/* Konten Tab 1: Rekening & Pembayaran */}
      {activeTab === "pembayaran" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* Form Rekening Bank */}
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#E2F0D9] text-[#2E5E4E] flex items-center justify-center">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#234E5C]">
                      Rekening Bank Pembayaran
                    </h3>
                    <p className="text-[11px] text-[#5F7A84]">
                      Tujuan transfer uang muka (DP) yang ditampilkan kepada penyewa
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">Nama Bank</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="BCA, Mandiri, BRI..."
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">Nomor Rekening</Label>
                  <Input
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value.replace(/\s+/g, ""))}
                    placeholder="1234567890"
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">Atas Nama (Pemilik)</Label>
                  <Input
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    placeholder="PT PirantiKu Nusantara"
                    className="h-10 text-xs font-semibold"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#5F7A84] bg-[#FAFAF8] p-3 rounded-lg border border-[#E8E8E1]">
                <strong className="text-[#234E5C]">Teks Gabungan di Database:</strong>{" "}
                <span className="font-mono text-[#A0630F]">
                  {bankName} {bankNumber} a/n {bankHolder}
                </span>
              </p>
            </div>

            {/* Form Kebijakan DP & Denda */}
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <div className="h-8 w-8 rounded-full bg-[#FEF3C7] text-[#A0630F] flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#234E5C]">
                    Kebijakan Nilai DP & Denda
                  </h3>
                  <p className="text-[11px] text-[#5F7A84]">
                    Aturan finansial yang digunakan saat checkout kalkulasi otomatis
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">
                    Besaran Uang Muka DP (%)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={10}
                      max={100}
                      value={dpPersen}
                      onChange={(e) => setDpPersen(e.target.value)}
                      className="h-10 text-xs font-bold pr-10"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#5F7A84]">
                      %
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5F7A84]">
                    Standar umum 30%. Sisa pelunasan dibayar saat serah terima.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">
                    Denda Keterlambatan / Hari
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#5F7A84]">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={10000}
                      value={dendaPerHari}
                      onChange={(e) => setDendaPerHari(e.target.value)}
                      className="h-10 text-xs font-bold pl-10"
                    />
                  </div>
                  <span className="text-[11px] text-[#5F7A84]">
                    Setara {formatRupiah(parseInt(dendaPerHari, 10) || 0)} per hari telat kembali.
                  </span>
                </div>
              </div>
            </div>

            {/* Form QRIS */}
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#234E5C]">
                      Kode QRIS Pembayaran Toko
                    </h3>
                    <p className="text-[11px] text-[#5F7A84]">
                      Mendukung GoPay, OVO, Dana, ShopeePay, BCA QRIS, dan mobile banking
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">
                    URL Gambar QRIS (atau Unggah File)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={qrisUrl}
                      onChange={(e) => setQrisUrl(e.target.value)}
                      placeholder="https://... atau klik tombol Unggah Gambar di samping"
                      className="h-10 text-xs font-mono"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleQrisFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingQris}
                      className="h-10 px-4 text-xs font-bold border-[#E8E8E1] shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {isUploadingQris ? "Memproses..." : "Unggah QRIS"}
                    </Button>
                  </div>
                  <span className="text-[11px] text-[#5F7A84]">
                    File gambar yang diunggah akan langsung dikompresi otomatis secara aman.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Tampilan Pelanggan */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
                  Simulasi Tampilan di Halaman Pembayaran
                </span>
                <span className="text-[10px] bg-[#E2F0D9] text-[#2E5E4E] font-bold px-2 py-0.5 rounded-full">
                  Live Preview
                </span>
              </div>

              {/* Preview Transfer Bank Card */}
              <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                    Metode: Transfer Bank
                  </span>
                  <span className="text-xs font-bold text-[#234E5C] bg-[#F3F3EF] px-2.5 py-1 rounded-md">
                    {bankName || "BCA"}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E8E8E1]/80 space-y-1">
                  <span className="text-[10px] text-[#5F7A84] uppercase font-bold">
                    Nomor Rekening Tujuan
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#234E5C] tracking-wide">
                      {bankNumber || "1234567890"}
                    </span>
                    <span className="text-[10px] font-bold text-[#A0630F] bg-white border border-[#E8E8E1] px-2 py-0.5 rounded">
                      Salin
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F7A84]">
                    Atas Nama: <strong className="text-[#234E5C]">{bankHolder || "PirantiKu"}</strong>
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#E8E8E1]">
                  <span className="text-[#5F7A84]">Ketentuan Uang Muka:</span>
                  <span className="font-bold text-[#A0630F]">{dpPersen}% dari Total Sewa</span>
                </div>
              </div>

              {/* Preview QRIS Card */}
              <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 space-y-3 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84] block text-left">
                  Metode: QRIS Standar
                </span>
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-[#E8E8E1]">
                  {qrisUrl ? (
                    <div className="relative h-44 w-44 rounded-lg overflow-hidden border border-[#E8E8E1] bg-white">
                      <Image
                        src={qrisUrl}
                        alt="QRIS Preview"
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-36 w-36 rounded-lg bg-[#FAFAF8] border-2 border-dashed border-[#E8E8E1] flex flex-col items-center justify-center p-3 text-[#5F7A84]">
                      <QrCode className="h-8 w-8 mb-1.5 opacity-50" />
                      <span className="text-[10px] font-bold">Belum Ada QRIS</span>
                      <span className="text-[9px] text-center">
                        Unggah gambar untuk menampilkan QRIS ke penyewa
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-[#5F7A84] mt-2 font-medium">
                    Penyewa dapat memindai via GoPay, BCA, Mandiri, ShopeePay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Konten Tab 2: Kontak & Operasional */}
      {activeTab === "kontak" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <div className="h-8 w-8 rounded-full bg-[#E2F0D9] text-[#2E5E4E] flex items-center justify-center">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#234E5C]">
                    Nomor WhatsApp Admin / CS
                  </h3>
                  <p className="text-[11px] text-[#5F7A84]">
                    Nomor tujuan penyewa untuk konfirmasi bukti transfer dan tanya jawab alat
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Nomor WhatsApp (Diawali kode negara 62)
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#5F7A84]">
                      +
                    </span>
                    <Input
                      value={whatsappAdmin}
                      onChange={(e) => setWhatsappAdmin(e.target.value.replace(/\D/g, ""))}
                      placeholder="6281234567890"
                      className="h-10 text-xs font-mono font-bold pl-7"
                    />
                  </div>
                  <a
                    href={waTestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[#2E5E4E] text-[#2E5E4E] hover:bg-[#E2F0D9] text-xs font-bold transition-colors shrink-0"
                  >
                    <span>Uji Kirim Pesan</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <span className="text-[11px] text-[#5F7A84]">
                  Gunakan format internasional tanpa tanda plus atau spasi, contoh: <strong>6281234567890</strong>.
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <div className="h-8 w-8 rounded-full bg-[#FEF3C7] text-[#A0630F] flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#234E5C]">
                    Jam Operasional Rental
                  </h3>
                  <p className="text-[11px] text-[#5F7A84]">
                    Jadwal buka pengambilan & pengembalian unit di gerai
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Teks Jam Kerja & Operasional
                </Label>
                <Input
                  value={jamOperasional}
                  onChange={(e) => setJamOperasional(e.target.value)}
                  placeholder="Senin - Minggu: 08.00 - 21.00 WIB"
                  className="h-10 text-xs font-medium"
                />
                <span className="text-[11px] text-[#5F7A84]">
                  Teks ini ditampilkan di halaman beranda (section Lokasi & Kontak) serta footer.
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-5 shadow-xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block border-b border-[#E8E8E1] pb-2">
                Tampilan Kartu Informasi di Beranda
              </span>

              <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#E2F0D9] text-[#2E5E4E] flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F7A84]">
                      WhatsApp Resmi
                    </span>
                    <p className="text-xs font-bold text-[#234E5C]">
                      +{whatsappAdmin || "6281234567890"}
                    </p>
                    <p className="text-[11px] text-[#2E5E4E] font-medium">
                      Aktif untuk konfirmasi sewa & panduan alat
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#E8E8E1] pt-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#FEF3C7] text-[#A0630F] flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F7A84]">
                      Jam Buka Gerai
                    </span>
                    <p className="text-xs font-bold text-[#234E5C]">
                      {jamOperasional || "Senin - Minggu: 08.00 - 21.00 WIB"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Konten Tab 3: Alamat & Lokasi Toko */}
      {activeTab === "lokasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <div className="h-8 w-8 rounded-full bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#234E5C]">
                    Alamat Pengambilan Alat
                  </h3>
                  <p className="text-[11px] text-[#5F7A84]">
                    Alamat fisik yang dituju oleh penyewa untuk serah terima peralatan
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#234E5C]">Alamat Lengkap</Label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#E8E8E1] bg-white p-3 text-xs text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C] transition-all"
                  placeholder="Jl. Manggis 5 No. 20, Watuburik, Wonorejo..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">
                    Latitude (Garis Lintang)
                  </Label>
                  <Input
                    value={lokasiLat}
                    onChange={(e) => setLokasiLat(e.target.value)}
                    placeholder="-7.526135"
                    className="h-10 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#234E5C]">
                    Longitude (Garis Bujur)
                  </Label>
                  <Input
                    value={lokasiLng}
                    onChange={(e) => setLokasiLng(e.target.value)}
                    placeholder="110.834555"
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#5F7A84]">
                  Koordinat ini dipakai untuk penanda titik peta interaktif di beranda.
                </span>
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#234E5C] hover:underline"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Cek di Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E8E8E1] pb-3">
                <MapPin className="h-4 w-4 text-[#234E5C]" />
                <h3 className="text-sm font-bold text-[#234E5C]">
                  Google Maps Embed URL (Opsional)
                </h3>
              </div>
              <div className="space-y-2">
                <Input
                  value={mapsEmbedUrl}
                  onChange={(e) => setMapsEmbedUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="h-10 text-xs font-mono"
                />
                <span className="text-[11px] text-[#5F7A84] block">
                  Bila diisi, iframe peta embed khusus akan diprioritaskan di section peta beranda.
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-5 shadow-xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block border-b border-[#E8E8E1] pb-2">
                Pratinjau Alamat Pengambilan
              </span>
              <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0630F]">
                  Alamat Pengambilan Alat
                </span>
                <p className="text-xs font-semibold text-[#234E5C] leading-relaxed">
                  {alamat || LOKASI_DEFAULT.alamat}
                </p>
                <div className="pt-2 border-t border-[#E8E8E1] flex items-center justify-between text-[11px] text-[#5F7A84]">
                  <span>Titik GPS:</span>
                  <span className="font-mono text-[#234E5C] font-semibold">
                    {lokasiLat}, {lokasiLng}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar untuk Simpan Cepat */}
      <div className="sticky bottom-4 rounded-2xl border border-[#E8E8E1] bg-white/95 backdrop-blur-md p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#5F7A84]">
          <CheckCircle2 className="h-4 w-4 text-[#2E5E4E]" />
          <span>
            Perubahan pengaturan akan langsung diterapkan ke seluruh halaman publik dan alur checkout.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="flex-1 sm:flex-none text-xs text-[#5F7A84]"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="warm"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none text-xs font-bold px-6"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? "Menyimpan ke Database..." : "Simpan Semua Pengaturan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
