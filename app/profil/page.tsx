"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateIndo } from "@/lib/format";
import { AnimatedText } from "@/components/ui/motion";
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
      <div className="mx-auto max-w-[1200px] px-4 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#234E5C] border-t-transparent" />
          <p className="text-sm text-[#5F7A84]">Memuat informasi profil...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin";
  const userInitials = (profile?.nama || userEmail || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 space-y-8 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-6 space-y-2">
        <AnimatedText
          text="PROFIL PENYEWA"
          mode="word"
          as="h1"
          className="section-title block"
        />
        <p className="text-sm text-[#5F7A84] font-medium">
          Kelola informasi nama dan nomor WhatsApp untuk kelancaran verifikasi booking serta pengambilan unit.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Ringkasan Akun */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#234E5C] text-white text-xl font-bold">
              {userInitials}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#234E5C]">
                  {profile?.nama || "Penyewa"}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3F3EF] border border-[#E8E8E1] text-[#234E5C]">
                  {isAdmin ? "Admin" : "Penyewa"}
                </span>
              </div>
              <p className="text-xs text-[#5F7A84]">{userEmail}</p>
              {profile?.created_at && (
                <p className="text-[11px] text-[#5F7A84] flex items-center gap-1 pt-0.5">
                  <Calendar className="h-3 w-3 text-[#234E5C]" />
                  Terdaftar sejak {formatDateIndo(profile.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Formulir Ubah Profil */}
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-3">
            Informasi Pribadi
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-xs font-semibold text-[#234E5C]">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                  <Input
                    id="nama"
                    type="text"
                    className="pl-10 text-xs"
                    placeholder="Nama Lengkap Anda"
                    {...register("nama")}
                  />
                </div>
                {errors.nama && (
                  <p className="text-xs text-[#DC2626] font-medium">{errors.nama.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="no_hp" className="text-xs font-semibold text-[#234E5C]">
                  Nomor WhatsApp / HP
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                  <Input
                    id="no_hp"
                    type="tel"
                    className="pl-10 text-xs"
                    placeholder="081234567890"
                    {...register("no_hp")}
                  />
                </div>
                {errors.no_hp && (
                  <p className="text-xs text-[#DC2626] font-medium">{errors.no_hp.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#5F7A84]">
                Alamat Email (Akun Autentikasi)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  value={userEmail}
                  disabled
                  className="pl-10 text-xs bg-[#F3F3EF] cursor-not-allowed text-[#5F7A84]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alamat" className="text-xs font-semibold text-[#234E5C]">
                Alamat Domisili
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
                <Input
                  id="alamat"
                  type="text"
                  className="pl-10 text-xs"
                  placeholder="Contoh: Jl. Sudirman No. 12, Jakarta"
                  {...register("alamat")}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#E8E8E1] bg-[#FAFAF8] p-3.5 flex items-start gap-2.5 text-xs text-[#5F7A84]">
              <Shield className="h-4 w-4 text-[#234E5C] shrink-0 mt-0.5" />
              <span>
                Data akun Anda hanya digunakan untuk verifikasi transaksi penyewaan dan keperluan serah terima barang di toko PirantiKu.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="warm"
                disabled={isSaving || !isDirty}
                className="px-6 text-xs font-bold"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                <Save className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
