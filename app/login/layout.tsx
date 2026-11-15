import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk Akun | PirantiKu",
  description: "Masuk ke akun PirantiKu untuk mengelola booking rental alat.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
