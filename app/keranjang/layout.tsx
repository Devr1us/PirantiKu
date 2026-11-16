import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keranjang Booking | PirantiKu",
  description: "Daftar peralatan yang siap Anda booking di PirantiKu.",
  robots: { index: false, follow: false },
};

export default function KeranjangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
