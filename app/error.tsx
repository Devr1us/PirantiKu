"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { H1, Lead, P } from "@/components/ui/typography";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    console.error("Terjadi runtime error di PirantiKu:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#FAFAF8] text-[#234E5C]">
      <div className="w-full max-w-lg rounded-2xl border border-[#E8E8E1] bg-white p-6 sm:p-8 shadow-sm space-y-6 text-center">
        {/* Ikon Peringatan */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
          <AlertTriangle className="h-8 w-8 stroke-[1.8]" />
        </div>

        {/* Header Pesan */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#A0630F]">
            Status: Kendala Sistem
          </span>
          <H1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#234E5C]">
            TERJADI KENDALA PADA HALAMAN
          </H1>
          <Lead className="text-xs sm:text-sm text-[#5F7A84] max-w-md mx-auto">
            Mohon maaf atas ketidaknyamanannya. Halaman gagal dimuat atau terjadi gangguan saat memproses data.
          </Lead>
        </div>

        {/* Aksi Pemulihan */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            onClick={() => reset()}
            variant="petrol"
            size="lg"
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Muat Ulang
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-[#E8E8E1] text-[#234E5C] hover:bg-[#F3F3EF] cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>

        {/* Accordion Detail Error Teknis */}
        <div className="pt-4 border-t border-[#E8E8E1] text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-semibold text-[#5F7A84] hover:text-[#234E5C] transition-colors cursor-pointer"
          >
            <span>Informasi Teknis Error</span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] space-y-2 text-xs text-[#234E5C] overflow-hidden">
              <P className="text-[11px] font-mono break-all text-[#991B1B]">
                {error.message || "Unknown error"}
              </P>
              {error.digest && (
                <p className="text-[10px] font-mono text-[#5F7A84]">
                  Digest ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
