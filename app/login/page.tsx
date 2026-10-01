"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ui/wordmark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/";

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetting, setIsResetting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak cocok. Silakan periksa kembali."
            : error.message
        );
        toast.error("Gagal masuk ke akun.");
        return;
      }

      if (authData.user) {
        toast.success("Berhasil masuk!");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        router.refresh();
        if (profile?.role === "admin") {
          router.push("/admin");
        } else {
          router.push(nextParam);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Masukkan alamat email yang valid");
      return;
    }
    setIsResetting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profil`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Email pemulihan kata sandi telah dikirim.");
        setIsForgotPasswordOpen(false);
        setResetEmail("");
      }
    } catch {
      toast.error("Gagal mengirim email reset kata sandi.");
    } finally {
      setIsResetting(false);
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
            <h2 className="text-xl font-bold uppercase tracking-tight text-white">
              Sewa Alat Praktis & Terpercaya
            </h2>
            <p className="text-xs text-white/80 leading-relaxed font-normal">
              Satu akun untuk menyewa seluruh perlengkapan camping, perkakas, olahraga, dan perayaan dengan stok terjamin per tanggal.
            </p>
          </div>

          <div className="text-[11px] text-white/60">
            &copy; {new Date().getFullYear()} PirantiKu
          </div>
        </div>

        {/* Kolom Kanan: Formulir Putih */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          {/* Header Mobile Wordmark */}
          <div className="md:hidden text-center pb-2">
            <Wordmark />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-tight text-[#234E5C]">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-[#5F7A84]">
              Gunakan email terdaftar untuk melanjutkan sewa atau cek booking.
            </p>
          </div>

          {/* Notifikasi Error Bergetar Halus */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{
                  opacity: 1,
                  x: [-5, 5, -3, 3, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEE2E2] p-3 text-xs text-[#991B1B]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
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
                <p className="text-xs text-[#DC2626] font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#234E5C]">
                  Kata Sandi
                </Label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[#A0630F] hover:underline font-semibold"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
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
              {errors.password && (
                <p className="text-xs text-[#DC2626] font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="warm"
                disabled={isLoading}
                className="w-full h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    Masuk Sekarang
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-[#E8E8E1]">
            <p className="text-xs text-[#5F7A84]">
              Belum punya akun?{" "}
              <Link
                href="/daftar"
                className="font-bold text-[#A0630F] hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Dialog Lupa Password */}
      <Dialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      >
        <DialogContent className="sm:max-w-md bg-white border-[#E8E8E1] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#234E5C]">
              <HelpCircle className="h-5 w-5 text-[#234E5C]" />
              Atur Ulang Kata Sandi
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F7A84]">
              Masukkan alamat email Anda untuk menerima instruksi reset kata sandi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs font-semibold text-[#234E5C]">
                Alamat Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="nama@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="warm"
                size="sm"
                disabled={isResetting}
                className="text-xs font-bold"
              >
                {isResetting ? "Mengirim..." : "Kirim Tautan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center bg-[#FAFAF8]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
