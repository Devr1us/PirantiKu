import Link from "next/link";
import {
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { H1, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  LocationMap,
  CopyAddressButton,
  DirectionsButton,
} from "@/components/home/LocationMap";
import { DEFAULT_SETTINGS, LOKASI_DEFAULT, normalizeAdminPhone } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function KontakPage() {
  const supabase = await createClient();

  let alamat = LOKASI_DEFAULT.alamat;
  let jamOperasional = DEFAULT_SETTINGS.jam_operasional;
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;
  let mapsEmbedUrl = "";
  let lokasiLat = LOKASI_DEFAULT.lat;
  let lokasiLng = LOKASI_DEFAULT.lng;

  const { data: settings } = await supabase.from("settings").select("key, value");
  if (settings) {
    settings.forEach((s) => {
      if (s.key === "alamat" && s.value) alamat = s.value;
      if (s.key === "jam_operasional" && s.value) jamOperasional = s.value;
      if (s.key === "whatsapp_admin" && s.value) whatsappAdmin = normalizeAdminPhone(s.value);
      if (s.key === "maps_embed_url" && s.value) mapsEmbedUrl = s.value;
      if (s.key === "lokasi_lat" && s.value) lokasiLat = parseFloat(s.value) || LOKASI_DEFAULT.lat;
      if (s.key === "lokasi_lng" && s.value) lokasiLng = parseFloat(s.value) || LOKASI_DEFAULT.lng;
    });
  }

  const cleanWa = normalizeAdminPhone(whatsappAdmin);
  const effectiveAlamat =
    alamat &&
    alamat !== "Isi alamat pengambilan alat di sini" &&
    alamat !== "Jl. Raya Rental No. 12, Jakarta"
      ? alamat
      : LOKASI_DEFAULT.alamat;

  return (
    <div className="site-container py-10 space-y-12 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <H1 className="section-title block">LOKASI &amp; KONTAK TOKO</H1>
        <Lead className="text-base text-[#5F7A84] font-medium max-w-2xl">
          Kunjungi toko kami untuk pengambilan unit atau hubungi admin WhatsApp untuk konsultasi ketersediaan alat.
        </Lead>
      </div>

      {/* Grid Informasi Kontak & Peta Interaktif */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Kolom Kiri: Detail Alamat, Jam Operasional & Layanan */}
        <div className="lg:col-span-5 h-full">
          <div className="bg-white border border-[#E8E8E1] rounded-2xl p-6 sm:p-8 space-y-6 h-full flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              {/* Alamat Toko */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F3EF] text-[#234E5C] shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                    Alamat Pengambilan Alat
                  </h3>
                  <p
                    id="alamat-pengambilan-page"
                    className="text-sm font-semibold text-[#234E5C] mt-1 leading-relaxed"
                  >
                    {effectiveAlamat}
                  </p>
                </div>
              </div>

              {/* Jam Operasional */}
              <div className="flex items-start gap-4 border-t border-[#E8E8E1] pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F3EF] text-[#234E5C] shrink-0 mt-0.5">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                    Jam Operasional
                  </h3>
                  <p className="text-sm font-semibold text-[#234E5C] mt-1 leading-relaxed">
                    {jamOperasional || "Senin - Minggu: 08.00 - 21.00 WIB"}
                  </p>
                  <p className="text-xs text-[#5F7A84] mt-0.5">
                    Melayani serah terima unit setiap hari termasuk hari libur nasional.
                  </p>
                </div>
              </div>

              {/* WhatsApp Layanan */}
              <div className="flex items-start gap-4 border-t border-[#E8E8E1] pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F3EF] text-[#234E5C] shrink-0 mt-0.5">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                    WhatsApp Pelayanan
                  </h3>
                  <a
                    href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#A0630F] hover:underline mt-1 block"
                  >
                    {cleanWa === "6285701516287" ? "+62 857-0151-6287" : `+${cleanWa}`}
                  </a>
                  <p className="text-xs text-[#5F7A84] mt-0.5">
                    Respons cepat untuk tanya stok, perpanjangan sewa, dan konfirmasi pembayaran.
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Petunjuk Arah & Salin Alamat */}
            <div className="border-t border-[#E8E8E1] pt-6 flex flex-wrap items-center gap-3">
              <DirectionsButton lat={lokasiLat} lng={lokasiLng} />
              <CopyAddressButton
                alamat={effectiveAlamat}
                targetElementId="alamat-pengambilan-page"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Peta Google Maps Embed Interaktif */}
        <div className="lg:col-span-7 h-full min-h-[360px] sm:min-h-[440px]">
          <div className="h-full rounded-2xl overflow-hidden border border-[#E8E8E1] shadow-xs">
            <LocationMap
              lat={lokasiLat}
              lng={lokasiLng}
              embedUrl={mapsEmbedUrl}
              alamat={effectiveAlamat}
            />
          </div>
        </div>
      </div>

      {/* Info Tambahan */}
      <div className="rounded-2xl border border-[#E8E8E1] bg-white p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-[#234E5C]">
          Petunjuk Menuju Lokasi Workshop:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#5F7A84]">
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-1">
            <span className="font-bold text-[#234E5C] block">Akses Kendaraan</span>
            <p>Lokasi mudah dijangkau kendaraan roda dua maupun mobil dengan area parkir yang memadai.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-1">
            <span className="font-bold text-[#234E5C] block">Cek Fisik Bersama</span>
            <p>Staf kami siap mendampingi pengecekan kelengkapan dan fungsi alat saat serah terima.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1] space-y-1">
            <span className="font-bold text-[#234E5C] block">Bantuan Pemuatan</span>
            <p>Tersedia bantuan untuk memuat peralatan berdimensi besar seperti tenda, genset, atau tangga ke kendaraan Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
