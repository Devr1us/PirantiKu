import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lokasi & Kontak Toko",
  description:
    "Informasi alamat pengambilan alat, peta interaktif, jam operasional, dan nomor WhatsApp resmi PirantiKu.",
};

export default function KontakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
