"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ui/wordmark";
import { H1, H2, Lead, P } from "@/components/ui/typography";
import { HoverRollText } from "@/components/ui/motion";
import { toast } from "sonner";

const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

const registerSchema = z
  .object({
    nama: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama terlalu panjang"),
    no_hp: z
      .string()
      .regex(phoneRegex, "Format no. HP tidak valid (contoh: 081234567890)"),
    email: z.string().email("Format email tidak valid"),
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
  const [isSuccessEmailCheck, setIsSuccessEmailCheck] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nama: "",
      no_hp: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const passwordVal = watch("password", "");
  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;

      let sanitizedPhone = data.no_hp.replace(/[^0-9]/g, "");
      if (sanitizedPhone.startsWith("0")) {
        sanitizedPhone = "62" + sanitizedPhone.slice(1);
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nama: data.nama.trim(),
            no_hp: sanitizedPhone,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || "Gagal melakukan pendaftaran akun.");
        return;
      }

      if (authData.session) {
        toast.success("Pendaftaran berhasil! Selamat datang di PirantiKu");
        router.refresh();
        router.push("/");
      } else {
        setRegisteredEmail(data.email);
        setIsSuccessEmailCheck(true);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccessEmailCheck) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-md rounded-2xl border border-[#E8E8E1] bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
            <Mail className="h-7 w-7" />
          </div>
          <H2 className="text-xl font-bold uppercase tracking-tight text-[#234E5C]">
            Cek Email Anda
          </H2>
          <Lead className="text-xs text-[#5F7A84] leading-relaxed">
            Kami telah mengirimkan tautan konfirmasi pendaftaran ke alamat:
          </Lead>
          <p className="font-semibold text-xs text-[#234E5C] bg-[#F3F3EF] py-2 px-3 rounded-lg">
            {registeredEmail}
          </p>
          <p className="text-[11px] text-[#5F7A84]">
            Silakan klik tautan di email tersebut untuk mengaktifkan akun dan mulai menyewa alat di PirantiKu.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="warm" className="w-full text-xs font-bold">
                Masuk ke Akun
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full text-xs font-bold">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Lengkapi data di bawah untuk kemudahan verifikasi jadwal sewa alat.
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

            {/* Nomor WhatsApp */}
            <div className="space-y-1">
              <Label htmlFor="no_hp" className="text-xs font-semibold text-[#234E5C]">
                Nomor WhatsApp Aktif
              </Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="no_hp"
                  type="tel"
                  placeholder="081234567890"
                  className="pl-10 text-xs"
                  {...register("no_hp")}
                />
              </div>
              {errors.no_hp && (
                <p className="text-[11px] text-[#DC2626] font-medium">{errors.no_hp.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-[#234E5C]">
                Alamat Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
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
                        className={`h-full flex-1 transition-all ${
                          step <= strength.score ? strength.color : "bg-[#E8E8E1]"
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
              <label className="flex items-start gap-2 text-xs text-[#5F7A84] cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-[#E8E8E1] text-[#234E5C] focus:ring-[#234E5C] accent-[#234E5C]"
                  {...register("agreeTerms")}
                />
                <span>
                  Saya menyetujui ketentuan peminjaman dan bersedia menjaga kondisi alat selama masa sewa.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-[11px] text-[#DC2626] font-medium mt-1">{errors.agreeTerms.message}</p>
              )}
            </div>

            {/* Tombol Daftar Ochre */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="warm"
                disabled={isLoading}
                className="w-full h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
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

          <div className="text-center pt-2 border-t border-[#E8E8E1]">
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
