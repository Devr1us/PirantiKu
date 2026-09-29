import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <section className="flex min-h-full flex-1 flex-col">{children}</section>;
}
