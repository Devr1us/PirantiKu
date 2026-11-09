import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RentalInvoice, type RentalInvoiceData } from "@/components/invoice/rental-invoice";
import { DEFAULT_SETTINGS, LOKASI_DEFAULT } from "@/lib/constants";
import type { BookingStatus } from "@/types/database";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: Promise<{ kode: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { kode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invoice/${kode}`);
  }

  // 1. Ambil data booking berdasarkan kode_booking atau id
  const { data: bByCode } = await supabase
    .from("bookings")
    .select(`
      *,
      items:booking_items(*, equipment:equipment(*)),
      payments(*),
      returns:booking_returns(*, damage_reports(*))
    `)
    .eq("kode_booking", kode)
    .single();

  let booking = bByCode;
  if (!booking) {
    const { data: bById } = await supabase
      .from("bookings")
      .select(`
        *,
        items:booking_items(*, equipment:equipment(*)),
        payments(*),
        returns:booking_returns(*, damage_reports(*))
      `)
      .eq("id", kode)
      .single();
    booking = bById;
  }

  if (!booking) {
    notFound();
  }

  // 2. Ambil profil user penyewa & cek role
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, no_hp, alamat, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = booking.user_id === user.id;

  if (!isOwner && !isAdmin) {
    redirect("/booking-saya");
  }

  // Ambil profil pemilik booking jika yang membuka adalah admin
  let customerProfile = profile;
  if (isAdmin && booking.user_id !== user.id) {
    const { data: ownerProf } = await supabase
      .from("profiles")
      .select("nama, no_hp, alamat, role")
      .eq("id", booking.user_id)
      .single();
    if (ownerProf) customerProfile = ownerProf;
  }

  // 3. Ambil data pengaturan toko
  let storeAddress = LOKASI_DEFAULT.alamat;
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;
  let jamOperasional = DEFAULT_SETTINGS.jam_operasional;

  const { data: setList } = await supabase.from("settings").select("key, value");
  if (setList) {
    setList.forEach((s) => {
      if (s.key === "alamat" && s.value) storeAddress = s.value;
      if (s.key === "whatsapp_admin" && s.value) whatsappAdmin = s.value;
      if (s.key === "jam_operasional" && s.value) jamOperasional = s.value;
    });
  }

  const invoiceData: RentalInvoiceData = {
    id: booking.id,
    kode_booking: booking.kode_booking,
    status: booking.status as BookingStatus,
    tanggal_mulai: booking.tanggal_mulai,
    tanggal_selesai: booking.tanggal_selesai,
    total_harga: booking.total_harga,
    deposit: booking.deposit,
    dp_jumlah: booking.dp_jumlah,
    catatan_penyewa: booking.catatan_penyewa,
    pesan_admin: booking.pesan_admin,
    created_at: booking.created_at,
    customer: {
      nama: customerProfile?.nama || "Penyewa",
      no_hp: customerProfile?.no_hp,
      alamat: customerProfile?.alamat || undefined,
    },
    items: ((booking.items || []) as Array<{
      id: number;
      qty: number;
      harga_per_hari: number;
      subtotal: number;
      equipment?: { nama: string } | null;
    }>).map((it) => ({
      id: it.id,
      qty: it.qty,
      harga_per_hari: it.harga_per_hari,
      subtotal: it.subtotal,
      equipment: it.equipment
        ? {
            nama: it.equipment.nama,
          }
        : null,
    })),
    settings: {
      alamat: storeAddress,
      whatsapp_admin: whatsappAdmin,
      jam_operasional: jamOperasional,
    },
    returnReport: Array.isArray(booking.returns)
      ? booking.returns[0] || null
      : booking.returns || null,
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 px-4 sm:px-6 print:p-0 print:bg-white">
      <div className="max-w-3xl mx-auto mb-4 print:hidden">
        <Link
          href={isAdmin ? "/admin/booking" : "/booking-saya"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5F7A84] hover:text-[#234E5C] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke {isAdmin ? "Kelola Booking" : "Booking Saya"}</span>
        </Link>
      </div>

      <RentalInvoice data={invoiceData} showPrintButton={true} />
    </div>
  );
}
