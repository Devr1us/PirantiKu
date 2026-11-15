import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export const metadata: Metadata = {
  title: "Admin Console | PirantiKu",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
