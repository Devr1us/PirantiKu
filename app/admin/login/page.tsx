"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";

const adminLoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextParam = searchParams.get("next") || "/admin";

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam === "unauthorized"
      ? "Sesi Anda bukan akun admin. Silakan masuk dengan akun pengelola."
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Kredensial login admin tidak sesuai."
            : error.message
        );
        toast.error("Gagal masuk portal admin.");
        return;
      }

      if (authData.user) {
        // Cek role di profiles
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profileErr || !profile || profile.role !== "admin") {
          // Bukan admin: langsung sign out!
          await supabase.auth.signOut();
          setErrorMessage("Akun ini tidak memiliki akses admin.");
          toast.error("Akun ini tidak memiliki akses admin.");
          return;
        }

        toast.success("Otorisasi admin berhasil.");
        router.refresh();
        router.push(nextParam);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-500/10">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Portal Keamanan Internal
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Login Administrator
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Akses khusus staf pengelola inventaris & booking {APP_NAME}
            </p>
          </div>
        </div>

        {/* Pesan Kesalahan */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, x: [-5, 5, -3, 3, 0] }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 font-medium"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-xs font-semibold text-slate-300">
              Email Administrator
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@sewadongkak.com"
                className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-teal-500"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-xs font-semibold text-slate-300">
              Kata Sandi Pengelola
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="pl-10 pr-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-teal-500"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl h-12 font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Mengautentikasi...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Masuk ke Console Admin
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda Publik
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[90vh] items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}
