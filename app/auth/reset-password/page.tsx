"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ui/wordmark";
import { H1, Lead } from "@/components/ui/typography";
import { toast } from "sonner";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(64, "Password maksimal 64 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Gagal memperbarui password.");
        return;
      }

      toast.success("Password berhasil diperbarui!");
      router.push("/login");
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
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
        className="w-full max-w-md rounded-2xl border border-[#E8E8E1] bg-white shadow-sm p-8 sm:p-10 space-y-6"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Wordmark asLink={false} />
        </div>

        {/* Ikon & Judul */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F4F7] border border-[#C5DDE5]">
            <ShieldCheck className="h-7 w-7 text-[#234E5C]" />
          </div>
          <H1 className="text-xl font-bold uppercase tracking-tight text-[#234E5C]">
            Buat Password Baru
          </H1>
          <Lead className="text-xs text-[#5F7A84]">
            Masukkan password baru untuk akun Anda.
          </Lead>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Password Baru */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#234E5C]">
              Password Baru (Minimal 8 Karakter)
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
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-[#DC2626] font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#234E5C]">
              Ulangi Password Baru
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 text-xs"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-3.5 text-[#5F7A84] hover:text-[#234E5C]"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-[#DC2626] font-medium">{errors.confirmPassword.message}</p>
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
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Simpan Password Baru
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
