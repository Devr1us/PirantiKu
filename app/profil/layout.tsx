import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Akun | PirantiKu",
  description:
    "Kelola informasi data diri, nomor WhatsApp, dan alamat domisili akun PirantiKu.",
  robots: { index: false, follow: false },
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
