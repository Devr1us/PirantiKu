import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun | PirantiKu",
  description: "Daftar akun baru di platform booking rental alat PirantiKu.",
  robots: { index: false, follow: false },
};

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
