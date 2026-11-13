"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Mail, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { H1, Lead } from "@/components/ui/typography";
import { toast } from "sonner";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = (searchParams.get("type") || "signup") as "signup" | "recovery";

  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown hitung mundur
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    // Hanya angka
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto fokus ke kotak berikutnya
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    // Fokus ke kotak terakhir yang terisi
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Masukkan 6 digit kode verifikasi.");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: type === "recovery" ? "recovery" : "signup",
      });

      if (error) {
        toast.error("Kode salah atau sudah kadaluarsa. Silakan coba lagi.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (type === "recovery") {
        toast.success("Verifikasi berhasil! Silakan buat password baru.");
        router.push("/auth/reset-password");
      } else {
        toast.success("Email terverifikasi! Selamat datang di PirantiKu.");
        router.refresh();
        router.push("/");
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      const supabase = createClient();
      if (type === "recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });
        if (error) throw error;
      }
      toast.success("Kode baru telah dikirim ke email Anda.");
      setCooldown(60);
    } catch {
      toast.error("Gagal mengirim ulang kode. Coba lagi.");
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 bg-[#FAFAF8]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-[#E8E8E1] bg-white shadow-sm p-8 sm:p-10 space-y-6"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Wordmark asLink={false} />
        </div>

        {/* Ikon & Judul */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F4F7] border border-[#C5DDE5]">
            <Mail className="h-7 w-7 text-[#234E5C]" />
          </div>
          <H1 className="text-xl font-bold uppercase tracking-tight text-[#234E5C]">
            {type === "recovery" ? "Reset Password" : "Verifikasi Email"}
          </H1>
          <Lead className="text-xs text-[#5F7A84] leading-relaxed">
            Kami mengirimkan kode 6 digit ke
          </Lead>
          <p className="text-xs font-bold text-[#234E5C] bg-[#F3F3EF] py-1.5 px-3 rounded-lg inline-block">
            {email}
          </p>
        </div>

        {/* Input OTP 6 kotak */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 text-center text-lg font-bold transition-all outline-none
                ${digit
                  ? "border-[#234E5C] bg-[#F3F3EF] text-[#234E5C]"
                  : "border-[#E8E8E1] bg-white text-[#234E5C]"
                }
                focus:border-[#234E5C] focus:ring-2 focus:ring-[#234E5C]/20`}
            />
          ))}
        </div>

        {/* Tombol Verifikasi */}
        <Button
          onClick={handleVerify}
          variant="warm"
          disabled={isLoading || !isComplete}
          className="w-full h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {type === "recovery" ? "Verifikasi & Lanjut" : "Verifikasi Sekarang"}
            </>
          )}
        </Button>

        {/* Kirim Ulang */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-[#5F7A84]">Tidak menerima kode?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A0630F] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
            {cooldown > 0
              ? `Kirim ulang dalam ${cooldown}s`
              : isResending
              ? "Mengirim..."
              : "Kirim ulang kode"}
          </button>
        </div>

        <p className="text-center text-[11px] text-[#5F7A84]">
          Kode berlaku selama <span className="font-semibold">10 menit</span>
        </p>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center bg-[#FAFAF8]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
        </div>
      }
    >
      <VerifyOtpForm />
    </React.Suspense>
  );
}
