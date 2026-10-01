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
import { Wordmark } from "@/components/ui/wordmark";
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
          await supabase.auth.signOut();
          setErrorMessage("Akun ini tidak memiliki akses pengelola (admin).");
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[#234E5C]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md space-y-6 rounded-2xl border border-[#E8E8E1] bg-white p-8 sm:p-10 shadow-xl"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <Wordmark />
          <div className="flex items-center gap-2 pt-2">
            <ShieldAlert className="h-5 w-5 text-[#A0630F]" />
            <h1 className="text-lg font-bold uppercase tracking-tight text-[#234E5C]">
              Portal Pengelola Admin
            </h1>
          </div>
          <p className="text-xs text-[#5F7A84]">
            Akses internal staf manajemen inventaris & transaksi {APP_NAME}
          </p>
        </div>

        {/* Pesan Kesalahan Bergetar Halus */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{
                opacity: 1,
                x: [-5, 5, -3, 3, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEE2E2] p-3 text-xs text-[#991B1B] font-medium"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-xs font-semibold text-[#234E5C]">
              Email Administrator
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@pirantiku.com"
                className="pl-10 text-xs"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-[#DC2626] font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-xs font-semibold text-[#234E5C]">
              Kata Sandi Pengelola
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 text-xs"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#5F7A84] hover:text-[#234E5C]"
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
                <span>Mengautentikasi...</span>
              ) : (
                <>
                  Masuk ke Console Admin
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="pt-3 border-t border-[#E8E8E1] text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5F7A84] hover:text-[#234E5C] transition-colors"
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
        <div className="flex min-h-screen items-center justify-center bg-[#234E5C]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}
