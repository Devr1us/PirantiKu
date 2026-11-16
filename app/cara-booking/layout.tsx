import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cara Booking Peralatan",
  description:
    "Panduan praktis 3 langkah mudah booking perlengkapan sewa di PirantiKu: pilih alat & tanggal, bayar DP, dan ambil alat di gerai.",
};

export default function CaraBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
