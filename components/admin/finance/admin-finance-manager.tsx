"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  Clock,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { FinanceSummaryTab } from "./finance-summary-tab";
import { FinanceVerificationTab } from "./finance-verification-tab";
import { FinanceTransactionsTab } from "./finance-transactions-tab";
import { FinanceDepositsTab } from "./finance-deposits-tab";

type FinanceTab = "ringkasan" | "verifikasi" | "transaksi" | "deposit";

interface AdminFinanceManagerProps {
  initialPendingCount?: number;
}

export function AdminFinanceManager({ initialPendingCount = 0 }: AdminFinanceManagerProps) {
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get("tab") as FinanceTab) || "ringkasan";

  const [activeTab, setActiveTab] = React.useState<FinanceTab>(tabParam);
  const [pendingCount, setPendingCount] = React.useState<number>(initialPendingCount);

  // Sync tab jika URL query param berubah
  React.useEffect(() => {
    if (tabParam && ["ringkasan", "verifikasi", "transaksi", "deposit"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Cek jumlah pending terbaru
  const refreshPendingCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/finance/summary?period=bulan_ini");
      const json = await res.json();
      if (json.summary?.pendingVerifications !== undefined) {
        setPendingCount(json.summary.pendingVerifications);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTabChange = (tab: FinanceTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const tabs = [
    {
      id: "ringkasan" as const,
      label: "Ringkasan",
      icon: TrendingUp,
      badge: null,
    },
    {
      id: "verifikasi" as const,
      label: "Verifikasi Pembayaran",
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: "bg-[#FEF3C7] text-[#78350F]",
    },
    {
      id: "transaksi" as const,
      label: "Daftar Transaksi",
      icon: Receipt,
      badge: null,
    },
    {
      id: "deposit" as const,
      label: "Deposit & Jaminan",
      icon: ShieldCheck,
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-[#E8E8E1]/40 rounded-2xl border border-[#E8E8E1] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#234E5C] text-white shadow-sm"
                  : "text-[#5F7A84] hover:text-[#234E5C] hover:bg-white/60"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-white text-[#234E5C]" : tab.badgeColor || "bg-[#234E5C] text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Konten Tab Aktif */}
      {activeTab === "ringkasan" && (
        <FinanceSummaryTab onGoToVerification={() => handleTabChange("verifikasi")} />
      )}

      {activeTab === "verifikasi" && (
        <FinanceVerificationTab
          onActionSuccess={() => {
            refreshPendingCount();
          }}
        />
      )}

      {activeTab === "transaksi" && <FinanceTransactionsTab />}

      {activeTab === "deposit" && <FinanceDepositsTab />}
    </div>
  );
}
