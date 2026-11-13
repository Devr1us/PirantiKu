"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ui/wordmark";
import { H1, H2, Lead, P } from "@/components/ui/typography";
import { HoverRollText } from "@/components/ui/motion";
import { toast } from "sonner";

const registerSchema = z
  .object({
    nama: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama terlalu panjang"),
    email: z
      .string()
      .email("Format email tidak valid")
      .refine((val) => val.toLowerCase().endsWith("@gmail.com"), {
        message: "Hanya email @gmail.com yang diizinkan",
      }),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(64, "Password maksimal 64 karakter"),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "Anda harus menyetujui syarat & ketentuan sewa",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "Kosong", color: "bg-[#E8E8E1]" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: "Lemah", color: "bg-[#DC2626]" };
    case 2:
      return { score: 2, label: "Sedang", color: "bg-[#D97706]" };
    case 3:
      return { score: 3, label: "Kuat", color: "bg-[#234E5C]" };
    case 4:
      return { score: 4, label: "Sangat Kuat", color: "bg-[#2E5E4E]" };
    default:
      return { score: 0, label: "Sangat Lemah", color: "bg-[#DC2626]" };
  }
}

export default function DaftarPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      toast.error("Gagal mendaftar dengan Google.");
      setIsGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const passwordVal = useWatch({ control, name: "password", defaultValue: "" });
  const agreeTermsVal = useWatch({ control, name: "agreeTerms", defaultValue: false });
  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nama: data.nama.trim(),
          },
        },
      });

      if (error) {
        toast.error(error.message || "Gagal melakukan pendaftaran akun.");
        return;
      }

      // Redirect ke halaman OTP verifikasi
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}&type=signup`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 bg-[#FAFAF8]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#E8E8E1] bg-white shadow-sm flex flex-col md:flex-row"
      >
        {/* Kolom Kiri: Panel Petrol Desktop */}
        <div className="hidden md:flex md:w-5/12 bg-[#234E5C] text-white p-10 flex-col justify-between">
          <div>
            <Wordmark variant="white" />
          </div>

          <div className="space-y-3 my-auto py-8">
            <H2 className="text-xl font-bold uppercase tracking-tight text-white">
              Bergabung dengan PirantiKu
            </H2>
            <P className="text-xs text-white/80 leading-relaxed font-normal">
              Daftar sekali untuk menyewa berbagai alat secara transparan dengan jadwal teratur dan jaminan pengembalian deposit utuh.
            </P>
          </div>

          <div className="text-[11px] text-white/60">
            &copy; {new Date().getFullYear()} PirantiKu
          </div>
        </div>

        {/* Kolom Kanan: Formulir Putih */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center space-y-5">
          {/* Header Mobile Wordmark */}
          <div className="md:hidden text-center pb-2">
            <Wordmark />
          </div>

          <div className="space-y-1">
            <H1 className="text-xl font-bold uppercase tracking-tight text-[#234E5C]">
              Buat Akun Penyewa
            </H1>
            <Lead className="text-xs text-[#5F7A84]">
              Gunakan akun Gmail Anda untuk mendaftar dan mulai sewa alat.
            </Lead>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <Label htmlFor="nama" className="text-xs font-semibold text-[#234E5C]">
                Nama Lengkap (sesuai KTP/SIM)
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="nama"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  className="pl-10 text-xs"
                  {...register("nama")}
                />
              </div>
              {errors.nama && (
                <p className="text-[11px] text-[#DC2626] font-medium">{errors.nama.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-[#234E5C]">
                Alamat Email Gmail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@gmail.com"
                  className="pl-10 text-xs"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#DC2626] font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-[#234E5C]">
                Kata Sandi (Minimal 8 Karakter)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 text-xs"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#5F7A84] hover:text-[#234E5C]"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {passwordVal && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#5F7A84]">Kekuatan: {strength.label}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-[#E8E8E1] overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all ${step <= strength.score ? strength.color : "bg-[#E8E8E1]"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-[11px] text-[#DC2626] font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#234E5C]">
                Ulangi Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 text-xs"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-[#5F7A84] hover:text-[#234E5C]"
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-[#DC2626] font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Syarat & Ketentuan */}
            <div className="pt-1">
              <label className={`flex items-start gap-2 text-xs cursor-pointer ${agreeTermsVal ? "text-[#234E5C]" : "text-[#5F7A84]"}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-[#E8E8E1] text-[#234E5C] focus:ring-[#234E5C] accent-[#234E5C]"
                  {...register("agreeTerms")}
                />
                <span>
                  Saya menyetujui{" "}
                  <span className="font-semibold text-[#234E5C]">ketentuan peminjaman</span>{" "}
                  dan bersedia menjaga kondisi alat selama masa sewa.{" "}
                  <span className="text-[#DC2626] font-bold">*</span>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-[11px] text-[#DC2626] font-medium mt-1">{errors.agreeTerms.message}</p>
              )}
              {!agreeTermsVal && !errors.agreeTerms && (
                <p className="text-[11px] text-[#5F7A84] mt-1">Wajib disetujui untuk melanjutkan pendaftaran.</p>
              )}
            </div>

            {/* Tombol Daftar Ochre */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="warm"
                disabled={isLoading || !agreeTermsVal}
                className="w-full h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>Memproses Akun...</span>
                ) : (
                  <>
                    <HoverRollText text="Daftar Sekarang" />
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Pemisah */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E8E8E1]" />
            <span className="text-[11px] text-[#5F7A84] font-medium">atau daftar dengan</span>
            <div className="flex-1 h-px bg-[#E8E8E1]" />
          </div>

          {/* Tombol Daftar Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#E8E8E1] bg-white px-4 py-2.5 text-xs font-semibold text-[#234E5C] hover:bg-[#F3F3EF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isGoogleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{isGoogleLoading ? "Menghubungkan..." : "Daftar dengan Google"}</span>
          </button>

          <div className="text-center border-t border-[#E8E8E1] pt-4">
            <p className="text-xs text-[#5F7A84]">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-bold text-[#A0630F] hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
