import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { H1, Lead } from "@/components/ui/typography";
import { AdminFinanceManager } from "@/components/admin/finance/admin-finance-manager";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  let pendingCount = 0;

  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .in("jenis", ["dp", "pelunasan"])
      .eq("status", "menunggu_verifikasi");

    if (count !== null) {
      pendingCount = count;
    }
  } catch (err) {
    console.error("Gagal memuat status keuangan awal:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Deskripsi */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <H1 mode="word" className="section-title block">
          KEUANGAN & DEPOSIT TOKO
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Pantau perputaran uang muka (DP), pelunasan sewa, uang jaminan (deposit), serta verifikasi mutasi buku besar.
        </Lead>
      </div>

      {/* Komponen Pengelola Keuangan */}
      <React.Suspense fallback={<div className="p-8 text-center text-xs text-[#5F7A84]">Memuat modul keuangan...</div>}>
        <AdminFinanceManager initialPendingCount={pendingCount} />
      </React.Suspense>
    </div>
  );
}
