import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Booking | PirantiKu",
  description: "Konfirmasi pemesanan dan pembayaran uang muka sewa alat di PirantiKu.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
