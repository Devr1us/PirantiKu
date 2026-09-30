"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_NAME } from "@/lib/constants";
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

        // Periksa apakah user adalah admin
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
        toast.success("Email pemulihan kata sandi telah dikirim. Cek inbox Anda.");
        setIsForgotPasswordOpen(false);
        setResetEmail("");
      }
    } catch {
      toast.error("Gagal mengirim email reset kata sandi.");
    } finally {
      setIsResetting(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl"
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
            Selamat Datang Kembali
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk untuk melanjutkan sewa alat atau mengelola pesanan
          </p>
        </div>

        {/* Notifikasi Error Otentikasi Bergetar */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: [-6, 6, -4, 4, -2, 2, 0],
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-foreground"
              >
                Password
              </Label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs text-primary hover:underline underline-offset-4 font-medium"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
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

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <Button
              type="submit"
              className="w-full rounded-2xl h-12 font-bold text-base shadow-md shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memverifikasi Akun...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Masuk Sekarang
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </motion.div>
        </form>

        {/* Link ke pendaftaran */}
        <motion.div variants={itemVariants} className="text-center pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/daftar"
              className="font-bold text-accent-warm hover:underline underline-offset-4"
            >
              Daftar sekarang
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* Dialog Lupa Password */}
      <Dialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Atur Ulang Kata Sandi
            </DialogTitle>
            <DialogDescription>
              Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk
              membuat kata sandi baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs font-semibold">
                Alamat Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="nama@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isResetting}
                className="rounded-xl font-semibold"
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
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
