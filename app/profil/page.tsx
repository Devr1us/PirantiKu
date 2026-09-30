"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Phone,
  MapPin,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDateIndo } from "@/lib/format";
import type { Profile } from "@/types/database";
import { toast } from "sonner";

const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

const profileSchema = z.object({
  nama: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama terlalu panjang"),
  no_hp: z
    .string()
    .regex(phoneRegex, "Format no. HP tidak valid (contoh: 081234567890)"),
  alamat: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [userEmail, setUserEmail] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama: "",
      no_hp: "",
      alamat: "",
    },
  });

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login?next=/profil");
          return;
        }

        setUserEmail(user.email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          toast.error("Gagal memuat profil: " + error.message);
        } else if (data) {
          const profileData = data as Profile;
          setProfile(profileData);
          reset({
            nama: profileData.nama || "",
            no_hp: profileData.no_hp || "",
            alamat: profileData.alamat || "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [reset, router]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      let sanitizedPhone = data.no_hp.replace(/[^0-9]/g, "");
      if (sanitizedPhone.startsWith("0")) {
        sanitizedPhone = "62" + sanitizedPhone.slice(1);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          nama: data.nama.trim(),
          no_hp: sanitizedPhone,
          alamat: data.alamat?.trim() || null,
        })
        .eq("id", profile.id);

      if (error) {
        toast.error("Gagal memperbarui profil: " + error.message);
      } else {
        toast.success("Profil berhasil diperbarui!");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                nama: data.nama.trim(),
                no_hp: sanitizedPhone,
                alamat: data.alamat?.trim() || null,
              }
            : null
        );
        reset({
          nama: data.nama.trim(),
          no_hp: sanitizedPhone,
          alamat: data.alamat?.trim() || "",
        });
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat informasi profil...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";
  const userInitials = (profile?.nama || userEmail || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-8"
      >
        {/* Header Profil */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground text-2xl font-bold shadow-md shadow-primary/20">
              {userInitials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {profile?.nama || "Penyewa"}
                </h1>
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="rounded-xl px-2.5 py-0.5 text-xs font-semibold"
                >
                  {isAdmin ? "Administrator" : "Penyewa"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              {profile?.created_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Bergabung sejak {formatDateIndo(profile.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Pengaturan Data Pribadi */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="border-b border-border pb-4 mb-6">
            <h2 className="text-lg font-bold text-foreground">
              Data Pribadi Penyewa
            </h2>
            <p className="text-xs text-muted-foreground">
              Pastikan nama dan nomor WhatsApp aktif untuk kelancaran verifikasi booking.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-xs font-semibold">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nama"
                    type="text"
                    className="pl-10"
                    placeholder="Nama Lengkap"
                    {...register("nama")}
                  />
                </div>
                {errors.nama && (
                  <p className="text-xs text-destructive">{errors.nama.message}</p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="no_hp" className="text-xs font-semibold">
                  Nomor WhatsApp / HP
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="no_hp"
                    type="tel"
                    className="pl-10"
                    placeholder="081234567890"
                    {...register("no_hp")}
                  />
                </div>
                {errors.no_hp && (
                  <p className="text-xs text-destructive">{errors.no_hp.message}</p>
                )}
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Alamat Email (Akun Autentikasi)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userEmail}
                  disabled
                  className="pl-10 bg-muted/60 text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Email terikat dengan akun autentikasi Anda.
              </p>
            </div>

            {/* Alamat Domisili */}
            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-xs font-semibold">
                Alamat Domisili / Pengiriman
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="alamat"
                  type="text"
                  className="pl-10"
                  placeholder="Contoh: Jl. Merdeka No. 10, Jakarta Selatan"
                  {...register("alamat")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Diperlukan bila menggunakan opsi pengantaran alat atau verifikasi identitas.
              </p>
            </div>

            {/* Role Akun (Read-only) */}
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Hak Akses Akun: {isAdmin ? "Administrator" : "Penyewa Umum"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kolom hak akses (role) diatur langsung oleh sistem database dan tidak dapat dimodifikasi secara manual.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="warm"
                disabled={isSaving || !isDirty}
                className="rounded-2xl h-11 px-6 font-bold shadow-md shadow-accent-warm/20"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
