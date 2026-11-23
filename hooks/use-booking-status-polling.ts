"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseBookingStatusPollingOptions {
  bookingId: string;
  initialStatus?: string;
  enabled?: boolean;
  redirectIfFinalOnMount?: boolean;
}

const POLLING_INTERVAL_MS = 4000; // 4 detik
const MAX_POLLING_DURATION_MS = 30 * 60 * 1000; // 30 menit

export function useBookingStatusPolling({
  bookingId,
  initialStatus,
  enabled = true,
  redirectIfFinalOnMount = false,
}: UseBookingStatusPollingOptions) {
  const router = useRouter();
  const [isTimeout, setIsTimeout] = React.useState<boolean>(false);
  const [isPollingActive, setIsPollingActive] = React.useState<boolean>(false);

  const hasRedirectedRef = React.useRef<boolean>(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);

  // Kasus Tepi 1: Hanya redirect saat mount jika opsi eksplisit redirectIfFinalOnMount diaktifkan
  React.useEffect(() => {
    if (!bookingId || !enabled || !redirectIfFinalOnMount) return;

    const isFinal =
      initialStatus === "terverifikasi" ||
      initialStatus === "ditolak" ||
      initialStatus === "dp_dibayar" ||
      initialStatus === "lunas" ||
      initialStatus === "diambil" ||
      initialStatus === "selesai" ||
      initialStatus === "dibatalkan";

    if (isFinal && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace("/booking-saya");
      router.refresh();
    }
  }, [bookingId, initialStatus, enabled, redirectIfFinalOnMount, router]);

  // Polling aktif HANYA saat status masih "menunggu verifikasi"
  React.useEffect(() => {
    if (!bookingId || !enabled) return;

    const isWaitingVerification =
      initialStatus === "menunggu_verifikasi" ||
      initialStatus === "menunggu_dp";

    // Jika bukan menunggu verifikasi atau sudah redirect, jangan jalankan polling
    if (!isWaitingVerification || hasRedirectedRef.current) {
      setIsPollingActive(false);
      return;
    }

    startTimeRef.current = Date.now();
    setIsPollingActive(true);

    const performRedirect = (type: "terverifikasi" | "ditolak") => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;

      // Hentikan interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPollingActive(false);

      // Toast singkat sesuai permintaan
      if (type === "terverifikasi") {
        toast.success("Pembayaran terverifikasi");
      } else {
        toast.error("Pembayaran ditolak");
      }

      // Redirect setelah sekitar 1,5 detik menggunakan router.replace
      setTimeout(() => {
        router.replace("/booking-saya");
        router.refresh();
      }, 1500);
    };

    const checkStatus = async () => {
      if (hasRedirectedRef.current) return;

      // Kasus Tepi: Cek batas waktu 30 menit
      if (startTimeRef.current > 0 && Date.now() - startTimeRef.current > MAX_POLLING_DURATION_MS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPollingActive(false);
        setIsTimeout(true);
        toast.info("Silakan cek status di Booking Saya", {
          action: {
            label: "Booking Saya",
            onClick: () => router.push("/booking-saya"),
          },
          duration: 10000,
        });
        return;
      }

      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/status`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store",
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const serverStatus = data?.status;

        if (serverStatus === "terverifikasi") {
          performRedirect("terverifikasi");
        } else if (serverStatus === "ditolak") {
          performRedirect("ditolak");
        }
      } catch {
        // Safe catch: tidak crash saat error jaringan
      }
    };

    const startInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(checkStatus, POLLING_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Mulai polling pertama kali
    startInterval();

    // Event listener visibilitychange: Berhenti saat tab tidak terlihat dan langsung cek ulang saat aktif kembali
    const handleVisibilityChange = () => {
      if (hasRedirectedRef.current) return;

      if (document.hidden) {
        stopInterval();
      } else {
        checkStatus(); // Langsung cek ulang saat tab aktif kembali
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Bersihkan interval saat unmount
    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [bookingId, initialStatus, enabled, router]);

  return {
    isTimeout,
    isPollingActive,
  };
}
