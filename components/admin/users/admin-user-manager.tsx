"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Trash2,
  Edit2,
  MessageCircle,
  AlertTriangle,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatWhatsAppNumber, formatDateIndo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H1, Lead } from "@/components/ui/typography";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Profile, UserRole } from "@/types/database";

export type ProfileWithStats = Profile & {
  total_bookings?: number;
  active_bookings?: number;
  email?: string | null;
};

interface AdminUserManagerProps {
  initialProfiles: ProfileWithStats[];
  currentAdminId: string;
}

export function AdminUserManager({
  initialProfiles,
  currentAdminId,
}: AdminUserManagerProps) {
  const router = useRouter();
  const [profiles, setProfiles] = React.useState<ProfileWithStats[]>(initialProfiles);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "user" | "admin">("all");

  // State Modal Edit
  const [editingProfile, setEditingProfile] = React.useState<ProfileWithStats | null>(null);
  const [editNama, setEditNama] = React.useState<string>("");
  const [editNoHp, setEditNoHp] = React.useState<string>("");
  const [editAlamat, setEditAlamat] = React.useState<string>("");
  const [editRole, setEditRole] = React.useState<UserRole>("user");
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);

  // State Modal Hapus
  const [deletingProfile, setDeletingProfile] = React.useState<ProfileWithStats | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  // Filter profil berdasarkan pencarian & role
  const filteredProfiles = React.useMemo(() => {
    return profiles.filter((p) => {
      const matchRole = roleFilter === "all" || p.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nama?.toLowerCase().includes(q) ||
        p.no_hp?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.alamat && p.alamat.toLowerCase().includes(q));

      return matchRole && matchSearch;
    });
  }, [profiles, searchQuery, roleFilter]);

  const totalUsers = profiles.filter((p) => p.role === "user").length;
  const totalAdmins = profiles.filter((p) => p.role === "admin").length;

  // Buka modal edit
  const handleOpenEdit = (p: ProfileWithStats) => {
    setEditingProfile(p);
    setEditNama(p.nama || "");
    setEditNoHp(p.no_hp || "");
    setEditAlamat(p.alamat || "");
    setEditRole(p.role || "user");
  };

  // Simpan perubahan profil
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    if (!editNama.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }
    if (!editNoHp.trim()) {
      toast.error("Nomor WhatsApp / HP tidak boleh kosong.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${editingProfile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editNama.trim(),
          no_hp: editNoHp.trim(),
          alamat: editAlamat.trim() || null,
          role: editRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data pengguna.");
      }

      setProfiles((prev) =>
        prev.map((item) =>
          item.id === editingProfile.id
            ? {
                ...item,
                nama: editNama.trim(),
                no_hp: editNoHp.trim(),
                alamat: editAlamat.trim() || null,
                role: editRole,
              }
            : item
        )
      );

      toast.success(data.message || "Data profil berhasil diperbarui.");
      setEditingProfile(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Konfirmasi & eksekusi hapus akun
  const handleConfirmDelete = async () => {
    if (!deletingProfile) return;

    if (deletingProfile.id === currentAdminId) {
      toast.error("Anda tidak dapat menghapus akun admin Anda sendiri yang sedang aktif.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingProfile.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus akun pengguna.");
      }

      setProfiles((prev) => prev.filter((item) => item.id !== deletingProfile.id));
      toast.success(data.message || `Akun ${deletingProfile.nama} berhasil dihapus.`);
      setDeletingProfile(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus pengguna.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Halaman */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <H1 mode="word" className="section-title block">
            KELOLA PENGGUNA
          </H1>
          <Lead className="text-sm text-[#5F7A84] font-medium">
            Kelola data akun user, hak akses role admin, dan kontrol keamanan akun PirantiKu.
          </Lead>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E2F0D9] border border-[#C5E1A5] text-xs font-bold text-[#2E5E4E]">
            <UserCheck className="h-4 w-4" />
            <span>{totalUsers} User</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-xs font-bold text-[#A0630F]">
            <ShieldCheck className="h-4 w-4" />
            <span>{totalAdmins} Admin</span>
          </div>
        </div>
      </div>

      {/* 2. Pencarian dan Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F7A84]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengguna, WhatsApp, atau ID akun..."
            className="pl-10 h-11 text-xs border-[#E8E8E1] bg-white rounded-xl focus:border-[#234E5C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5F7A84] hover:text-[#234E5C]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5F7A84] hidden sm:inline">Role:</span>
          <div className="flex items-center p-1 rounded-xl bg-white border border-[#E8E8E1]">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === "all"
                  ? "bg-[#234E5C] text-white shadow-xs"
                  : "text-[#5F7A84] hover:text-[#234E5C]"
              }`}
            >
              Semua ({profiles.length})
            </button>
            <button
              onClick={() => setRoleFilter("user")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === "user"
                  ? "bg-[#234E5C] text-white shadow-xs"
                  : "text-[#5F7A84] hover:text-[#234E5C]"
              }`}
            >
              User ({totalUsers})
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === "admin"
                  ? "bg-[#234E5C] text-white shadow-xs"
                  : "text-[#5F7A84] hover:text-[#234E5C]"
              }`}
            >
              Admin ({totalAdmins})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tabel Data Pengguna */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
            Daftar Akun Terdaftar ({filteredProfiles.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kontak WhatsApp</th>
                <th className="py-3 px-4">Domisili / Alamat</th>
                <th className="py-3 px-4">Role Akses</th>
                <th className="py-3 px-4">Terdaftar Sejak</th>
                <th className="py-3 px-4 text-center">Riwayat Booking</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((p) => {
                  const isCurrentAdmin = p.id === currentAdminId;
                  const initials = (p.nama || "U").slice(0, 2).toUpperCase();

                  return (
                    <tr key={p.id} className="hover:bg-[#F3F3EF]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            p.role === "admin"
                              ? "bg-[#FEF3C7] text-[#A0630F] border border-[#FDE68A]"
                              : "bg-[#E8F5E9] text-[#2E5E4E] border border-[#C5E1A5]"
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#234E5C] text-xs">
                                {p.nama}
                              </span>
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#234E5C] text-white">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#5F7A84] font-mono block">
                              ID: {p.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {p.no_hp ? (
                          <div className="flex items-center gap-2">
                            <span>{p.no_hp}</span>
                            <a
                              href={`https://wa.me/${formatWhatsAppNumber(p.no_hp)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-1 rounded-md bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] transition-colors"
                              title="Chat WhatsApp User"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[#5F7A84] italic">Belum diisi</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="line-clamp-2 text-[#5F7A84]">
                          {p.alamat || "-"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#A0630F] border border-[#FDE68A] text-[10px] font-extrabold uppercase">
                            <ShieldAlert className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] text-[10px] font-extrabold uppercase">
                            <UserCheck className="h-3 w-3" />
                            User
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#5F7A84]">
                        {formatDateIndo(p.created_at, "d MMM yyyy")}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[#234E5C] bg-[#F3F3EF] px-2.5 py-1 rounded-full text-xs">
                          <ShoppingBag className="h-3 w-3 text-[#A0630F]" />
                          {p.total_bookings || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 text-[11px] font-bold border-[#E8E8E1] hover:border-[#234E5C] text-[#234E5C]"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          {!isCurrentAdmin ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingProfile(p)}
                              className="h-8 text-[11px] font-bold text-[#DC2626] hover:bg-[#FEE2E2]"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Hapus
                            </Button>
                          ) : (
                            <span className="text-[10px] text-[#5F7A84] italic px-2">
                              Akun Aktif
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#5F7A84]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-8 w-8 text-[#5F7A84]/40" />
                      <p className="font-semibold text-xs">
                        Tidak ada akun pengguna yang sesuai dengan pencarian Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Edit Pengguna & Role */}
      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="max-w-md bg-white border border-[#E8E8E1] p-6 rounded-2xl shadow-xl">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-[#234E5C]">
              Edit Data Akun Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F7A84]">
              Perbarui nama, nomor WhatsApp, domisili, atau role hak akses akun pengguna.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#234E5C]">Nama Lengkap *</Label>
              <Input
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                required
                className="h-10 text-xs border-[#E8E8E1] focus:border-[#234E5C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#234E5C]">Nomor WhatsApp / HP *</Label>
              <Input
                value={editNoHp}
                onChange={(e) => setEditNoHp(e.target.value)}
                required
                placeholder="Contoh: 081234567890"
                className="h-10 text-xs border-[#E8E8E1] focus:border-[#234E5C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#234E5C]">Alamat Domisili</Label>
              <textarea
                value={editAlamat}
                onChange={(e) => setEditAlamat(e.target.value)}
                rows={2}
                placeholder="Alamat lengkap user..."
                className="w-full rounded-xl border border-[#E8E8E1] p-2.5 text-xs text-[#234E5C] focus:border-[#234E5C] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-[#234E5C]">Hak Akses (Role)</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditRole("user")}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    editRole === "user"
                      ? "border-[#234E5C] bg-[#234E5C]/5 text-[#234E5C]"
                      : "border-[#E8E8E1] text-[#5F7A84] hover:bg-[#F3F3EF]"
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>User</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditRole("admin")}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    editRole === "admin"
                      ? "border-[#A0630F] bg-[#FEF3C7] text-[#A0630F]"
                      : "border-[#E8E8E1] text-[#5F7A84] hover:bg-[#F3F3EF]"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Administrator</span>
                </button>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-[#E8E8E1]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProfile(null)}
                disabled={isUpdating}
                className="text-xs font-semibold h-10 flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="petrol"
                disabled={isUpdating}
                className="text-xs font-bold h-10 flex-1"
              >
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Modal Konfirmasi Hapus Akun */}
      <Dialog open={!!deletingProfile} onOpenChange={(open) => !open && setDeletingProfile(null)}>
        <DialogContent className="max-w-md bg-white border border-[#E8E8E1] p-6 rounded-2xl shadow-xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]">
              <AlertTriangle className="h-6 w-6 stroke-[2]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#234E5C]">
              Hapus Akun Pengguna?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5F7A84] leading-relaxed">
              Anda akan menghapus akun{" "}
              <strong className="text-[#234E5C]">{deletingProfile?.nama}</strong> ({deletingProfile?.no_hp}).
              Tindakan ini permanen dan akan menghapus akses login user pada sistem PirantiKu.
            </DialogDescription>
          </DialogHeader>

          {deletingProfile && (deletingProfile.active_bookings || 0) > 0 && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] space-y-1">
              <strong className="block font-bold">Peringatan:</strong>
              Pengguna ini masih memiliki {deletingProfile.active_bookings} pesanan rental aktif yang sedang berjalan.
              Pastikan peralatan telah dikembalikan atau pesanan dibatalkan sebelum menghapus akun.
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-[#E8E8E1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingProfile(null)}
              disabled={isDeleting}
              className="text-xs font-semibold h-10 flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs font-bold h-10 flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
