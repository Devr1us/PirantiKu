"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { H1, Lead } from "@/components/ui/typography";
import { Reveal } from "@/components/ui/motion";
import { motion, useReducedMotion } from "motion/react";
import type { Booking, BookingItem, EquipmentItem, BookingStatusHistory } from "@/types/database";

type BookingWithDetails = Booking & {
  items: (BookingItem & { equipment?: EquipmentItem | null })[];
  history: BookingStatusHistory[];
};

export default function BookingSayaPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [bookings, setBookings] = React.useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadBookings() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?next=/booking-saya");
          return;
        }

        const { data: bData, error } = await supabase
          .from("bookings")
          .select(`
            *,
            items:booking_items(*, equipment:equipment(*)),
            history:booking_status_history(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && bData) {
          setBookings(bData as BookingWithDetails[]);
        }
      } catch (err) {
        console.error("Gagal memuat booking saya:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, [router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
          <p className="text-sm text-[#5F7A84]">Memuat daftar pesanan sewa Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 space-y-8 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <H1 className="section-title block">
          BOOKING SAYA
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Pantau status verifikasi pembayaran uang muka, jadwal pengambilan alat, dan riwayat pengembalian barang sewa Anda.
        </Lead>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking, index) => {
            if (shouldReduceMotion) {
              return (
                <div key={booking.id} className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
                  {/* Header Kartu Booking */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-[#234E5C] px-2.5 py-1 rounded-lg bg-[#F3F3EF] border border-[#E8E8E1]">
                          {booking.kode_booking}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="text-xs text-[#5F7A84] pt-0.5">
                        Dibuat pada {formatDateIndo(booking.created_at, "d MMMM yyyy, HH:mm")} WIB
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-[#5F7A84] block">
                        Total Biaya Sewa
                      </span>
                      <span className="text-base font-extrabold text-[#A0630F]">
                        {formatRupiah(booking.total_harga)}
                      </span>
                    </div>
                  </div>

                  {/* Jadwal dan Barang */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Jadwal Sewa */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                        Rentang Waktu Sewa
                      </h4>
                      <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-3.5 flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-[#234E5C] shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-[#234E5C]">
                            {formatDateIndo(booking.tanggal_mulai, "d MMM yyyy")} &rarr; {formatDateIndo(booking.tanggal_selesai, "d MMM yyyy")}
                          </span>
                          <p className="text-[#5F7A84] text-[11px]">
                            Harap mengambil dan mengembalikan unit sesuai rentang tanggal tersebut.
                          </p>
                        </div>
                      </div>

                      {booking.pesan_admin && (
                        <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-3.5 flex items-start gap-2.5 text-xs text-[#78350F]">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Pesan dari Pengelola:</span>
                            <p>{booking.pesan_admin}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Daftar Peralatan */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                        Peralatan yang Disewa ({booking.items?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {booking.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-[#234E5C] shrink-0" />
                              <span className="font-bold text-[#234E5C]">
                                {item.equipment?.nama || "Alat Rental"}
                              </span>
                            </div>
                            <span className="font-semibold text-[#5F7A84]">
                              {item.qty} unit
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Status Riwayat (Muncul berurutan) */}
                  {booking.history && booking.history.length > 0 && (
                    <div className="pt-3 border-t border-[#E8E8E1] space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
                        Riwayat Perubahan Status
                      </span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {booking.history.map((hist, hIdx) => (
                          <div
                            key={hist.id || hIdx}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E8E8E1] bg-[#FAFAF8] text-[11px] text-[#5F7A84]"
                          >
                            <Clock className="h-3 w-3 text-[#234E5C]" />
                            <span className="font-semibold text-[#234E5C]">
                              {hist.status_baru.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-[#5F7A84]">
                              ({formatDateIndo(hist.created_at, "d MMM, HH:mm")})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Reveal key={booking.id} duration={0.32}>
                <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-5">
                  {/* Header Kartu Booking */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-[#234E5C] px-2.5 py-1 rounded-lg bg-[#F3F3EF] border border-[#E8E8E1]">
                          {booking.kode_booking}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="text-xs text-[#5F7A84] pt-0.5">
                        Dibuat pada {formatDateIndo(booking.created_at, "d MMMM yyyy, HH:mm")} WIB
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-[#5F7A84] block">
                        Total Biaya Sewa
                      </span>
                      <span className="text-base font-extrabold text-[#A0630F]">
                        {formatRupiah(booking.total_harga)}
                      </span>
                    </div>
                  </div>

                  {/* Jadwal dan Barang */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Jadwal Sewa */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                        Rentang Waktu Sewa
                      </h4>
                      <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-3.5 flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-[#234E5C] shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-[#234E5C]">
                            {formatDateIndo(booking.tanggal_mulai, "d MMM yyyy")} &rarr; {formatDateIndo(booking.tanggal_selesai, "d MMM yyyy")}
                          </span>
                          <p className="text-[#5F7A84] text-[11px]">
                            Harap mengambil dan mengembalikan unit sesuai rentang tanggal tersebut.
                          </p>
                        </div>
                      </div>

                      {booking.pesan_admin && (
                        <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-3.5 flex items-start gap-2.5 text-xs text-[#78350F]">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Pesan dari Pengelola:</span>
                            <p>{booking.pesan_admin}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Daftar Peralatan */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
                        Peralatan yang Disewa ({booking.items?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {booking.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-[#234E5C] shrink-0" />
                              <span className="font-bold text-[#234E5C]">
                                {item.equipment?.nama || "Alat Rental"}
                              </span>
                            </div>
                            <span className="font-semibold text-[#5F7A84]">
                              {item.qty} unit
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Status Riwayat (Muncul berurutan) */}
                  {booking.history && booking.history.length > 0 && (
                    <div className="pt-3 border-t border-[#E8E8E1] space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
                        Riwayat Perubahan Status
                      </span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {booking.history.map((hist, hIdx) => (
                          <div
                            key={hist.id || hIdx}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E8E8E1] bg-[#FAFAF8] text-[11px] text-[#5F7A84]"
                          >
                            <Clock className="h-3 w-3 text-[#234E5C]" />
                            <span className="font-semibold text-[#234E5C]">
                              {hist.status_baru.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-[#5F7A84]">
                              ({formatDateIndo(hist.created_at, "d MMM, HH:mm")})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-[#E8E8E1] bg-white space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F3EF] text-[#234E5C]">
            <Package className="h-8 w-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#234E5C]">
              Belum Ada Riwayat Booking
            </h3>
            <p className="text-xs text-[#5F7A84] max-w-sm">
              Anda belum pernah menyewa peralatan di PirantiKu. Buka katalog untuk mulai mencari perlengkapan kebutuhan Anda.
            </p>
          </div>
          <Link href="/alat">
            <Button variant="warm" className="px-6 text-xs font-bold">
              Buka Katalog Alat
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Info Bantuan */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 flex items-start sm:items-center gap-3 text-xs text-[#5F7A84]">
        <ShieldCheck className="h-5 w-5 text-[#234E5C] shrink-0 mt-0.5 sm:mt-0" />
        <p>
          Butuh konfirmasi cepat atau ada pertanyaan terkait pesanan Anda? Silakan hubungi admin kami via WhatsApp dengan menyertakan kode booking.
        </p>
      </div>
    </div>
  );
}
