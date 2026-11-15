import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Saya | PirantiKu",
  description: "Kelola riwayat dan status pemesanan rental alat Anda di PirantiKu.",
  robots: { index: false, follow: false },
};

export default function BookingSayaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
