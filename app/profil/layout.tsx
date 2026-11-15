import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Penyewa",
  description:
    "Kelola informasi data diri, nomor WhatsApp, dan alamat domisili akun penyewa PirantiKu.",
  robots: { index: false, follow: false },
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
