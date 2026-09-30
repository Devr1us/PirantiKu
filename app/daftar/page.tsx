"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Layers,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
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
  if (!password) return { score: 0, label: "Kosong", color: "bg-muted" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: "Lemah", color: "bg-rose-500" };
    case 2:
      return { score: 2, label: "Sedang", color: "bg-amber-500" };
    case 3:
      return { score: 3, label: "Kuat", color: "bg-teal-500" };
    case 4:
      return { score: 4, label: "Sangat Kuat", color: "bg-emerald-500" };
    default:
      return { score: 0, label: "Sangat Lemah", color: "bg-rose-400" };
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

      // Normalisasi no HP
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

      // Periksa apakah konfirmasi email dimatikan (session langsung ada)
      if (authData.session) {
        toast.success("Pendaftaran berhasil! Selamat datang di " + APP_NAME);
        router.refresh();
        router.push("/");
      } else {
        // Konfirmasi email aktif
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

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (isSuccessEmailCheck) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm mb-6">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Cek Email Kamu
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Kami telah mengirimkan tautan konfirmasi pendaftaran ke alamat:
          </p>
          <p className="mt-1 font-semibold text-foreground bg-muted/60 py-1.5 px-3 rounded-xl text-sm">
            {registeredEmail}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Silakan klik tombol konfirmasi di email tersebut untuk mengaktifkan akun dan mulai menyewa alat.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full rounded-2xl h-11 font-semibold">
                Masuk ke Akun
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full rounded-2xl h-11 text-xs">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg space-y-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl"
      >
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group transition-transform active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground shadow-md shadow-primary/25">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold text-foreground">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground pt-2">
            Buat Akun Penyewa Baru
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar sekali untuk sewa berbagai macam alat dengan mudah dan aman
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nama Lengkap */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="nama" className="text-xs font-semibold text-foreground">
              Nama Lengkap
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="nama"
                type="text"
                placeholder="Contoh: Budi Pratama"
                className="pl-10"
                {...register("nama")}
              />
            </div>
            <AnimatePresence>
              {errors.nama && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-destructive flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.nama.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Nomor WhatsApp */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="no_hp" className="text-xs font-semibold text-foreground">
              Nomor WhatsApp / HP
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="no_hp"
                type="tel"
                placeholder="081234567890"
                className="pl-10"
                {...register("no_hp")}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Digunakan untuk konfirmasi jadwal dan info pengambilan alat.
            </p>
            <AnimatePresence>
              {errors.no_hp && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-destructive flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.no_hp.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Email */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Alamat Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                className="pl-10"
                {...register("email")}
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-destructive flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                className="pl-10 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground p-0.5"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Indikator Kekuatan Password */}
            {passwordVal && (
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Kekuatan password:</span>
                  <span className="font-semibold text-foreground">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all duration-300 ${
                        step <= strength.score ? strength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-destructive flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Konfirmasi Password */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
              Konfirmasi Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password di atas"
                className="pl-10 pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground p-0.5"
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <AnimatePresence>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-destructive flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Syarat & Ketentuan */}
          <motion.div variants={itemVariants} className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                {...register("agreeTerms")}
              />
              <span>
                Saya menyetujui{" "}
                <span className="font-semibold text-foreground hover:underline">
                  Syarat & Ketentuan Sewa
                </span>{" "}
                serta kewajiban menjaga kondisi alat selama masa peminjaman.
              </span>
            </label>
            <AnimatePresence>
              {errors.agreeTerms && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-destructive flex items-center gap-1 mt-1.5"
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.agreeTerms.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <Button
              type="submit"
              variant="warm"
              className="w-full rounded-2xl h-12 font-bold text-base shadow-lg shadow-accent-warm/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memproses Pendaftaran...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Link ke login */}
        <motion.div variants={itemVariants} className="text-center pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              Masuk di sini
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
