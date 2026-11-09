"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Package,
  Mountain,
  Hammer,
  Dumbbell,
  Home,
  PartyPopper,
  Wrench,
  Camera,
  Music,
  Tent,
  Sparkles,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryIcon, getCategoryDescription } from "@/lib/constants";
import type { Category } from "@/types/database";

export type CategoryWithCount = Category & {
  equipment_count?: number;
};

interface AdminCategoryManagerProps {
  initialCategories: CategoryWithCount[];
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Daftar pilihan icon resmi
const AVAILABLE_ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "mountain", label: "Outdoor", icon: Mountain },
  { key: "hammer", label: "Perkakas", icon: Hammer },
  { key: "dumbbell", label: "Olahraga", icon: Dumbbell },
  { key: "home", label: "Rumah", icon: Home },
  { key: "party-popper", label: "Pesta", icon: PartyPopper },
  { key: "camera", label: "Kamera", icon: Camera },
  { key: "wrench", label: "Otomotif", icon: Wrench },
  { key: "heart-pulse", label: "Kesehatan", icon: HeartPulse },
  { key: "music", label: "Musik/Audio", icon: Music },
  { key: "tent", label: "Tenda", icon: Tent },
  { key: "sparkles", label: "Spesial", icon: Sparkles },
  { key: "package", label: "Umum", icon: Package },
];

export function AdminCategoryManager({
  initialCategories,
}: AdminCategoryManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = React.useState<CategoryWithCount[]>(initialCategories);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Form Fields
  const [nama, setNama] = React.useState<string>("");
  const [slug, setSlug] = React.useState<string>("");
  const [isCustomSlug, setIsCustomSlug] = React.useState<boolean>(false);
  const [ikon, setIkon] = React.useState<string>("package");
  const [urutan, setUrutan] = React.useState<string>("1");

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setNama("");
    setSlug("");
    setIsCustomSlug(false);
    setIkon("package");
    setUrutan(String((categories.length || 0) + 1));
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CategoryWithCount) => {
    setEditingId(item.id);
    setNama(item.nama);
    setSlug(item.slug);
    setIsCustomSlug(true);
    setIkon(item.ikon || "package");
    setUrutan(String(item.urutan || 1));
    setIsModalOpen(true);
  };

  const handleNamaChange = (val: string) => {
    setNama(val);
    if (!isCustomSlug && !editingId) {
      setSlug(slugify(val));
    }
  };

  // Submit Save Category (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    const finalSlug = (slug.trim() || slugify(nama)).toLowerCase();
    const finalUrutan = parseInt(urutan, 10) || 1;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // UPDATE
        const { data: updatedCat, error: catErr } = await supabase
          .from("categories")
          .update({
            nama: nama.trim(),
            slug: finalSlug,
            ikon,
            urutan: finalUrutan,
          })
          .eq("id", editingId)
          .select()
          .single();

        if (catErr) throw catErr;

        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  ...(updatedCat as Category),
                }
              : c
          )
        );

        toast.success(`Kategori "${nama}" berhasil diperbarui!`);
      } else {
        // CREATE
        const { data: newCat, error: catErr } = await supabase
          .from("categories")
          .insert({
            nama: nama.trim(),
            slug: finalSlug,
            ikon,
            urutan: finalUrutan,
          })
          .select()
          .single();

        if (catErr) throw catErr;

        if (newCat) {
          setCategories((prev) => [
            ...prev,
            { ...(newCat as Category), equipment_count: 0 },
          ]);
        }

        toast.success(`Kategori "${nama}" berhasil dibuat!`);
      }

      setIsModalOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      console.error("Gagal menyimpan kategori:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal menyimpan kategori: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category
  const handleDelete = async (item: CategoryWithCount) => {
    if ((item.equipment_count || 0) > 0) {
      alert(
        `Kategori "${item.nama}" tidak dapat dihapus karena masih digunakan oleh ${item.equipment_count} alat. Silakan ubah kategori alat terkait terlebih dahulu.`
      );
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${item.nama}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== item.id));
      toast.success(`Kategori "${item.nama}" berhasil dihapus.`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus kategori";
      toast.error(msg);
    }
  };

  // Filter Search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.ikon.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Bar Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Total Kategori Aktif
            </span>
            <span className="text-2xl font-extrabold text-[#234E5C]">
              {categories.length} <span className="text-xs font-semibold text-[#5F7A84]">kategori</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#FAFAF8] border border-[#E8E8E1] flex items-center justify-center text-[#234E5C]">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Tampil di Navigasi Beranda
            </span>
            <span className="text-2xl font-extrabold text-[#2E5E4E]">
              {categories.length} <span className="text-xs font-semibold text-[#5F7A84]">tersinkronisasi</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#E2F0D9] text-[#2E5E4E] flex items-center justify-center">
            <Check className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Toolbar & Tambah */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5F7A84]" />
          <Input
            type="text"
            placeholder="Cari nama atau slug kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-white rounded-xl"
          />
        </div>

        <Button
          type="button"
          variant="warm"
          size="sm"
          onClick={handleOpenCreate}
          className="text-xs font-bold gap-1.5 shadow-sm h-10 px-5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori Baru</span>
        </Button>
      </div>

      {/* 3. Tabel Data Kategori */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Urutan</th>
                <th className="py-3 px-4 w-16 text-center">Ikon</th>
                <th className="py-3 px-4">Nama Kategori</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4 text-center">Total Alat</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const IconComp = getCategoryIcon(cat.ikon);
                  return (
                    <tr key={cat.id} className="hover:bg-[#F3F3EF]/50 transition-colors">
                      {/* Urutan */}
                      <td className="py-3.5 px-4 font-mono font-bold text-center text-[#5F7A84]">
                        {cat.urutan}
                      </td>

                      {/* Ikon */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F3EF] border border-[#E8E8E1] mx-auto text-[#234E5C]">
                          <IconComp className="h-4 w-4" />
                        </div>
                      </td>

                      {/* Nama Kategori */}
                      <td className="py-3.5 px-4 font-bold text-[#234E5C]">
                        <Link
                          href={`/kategori/${cat.slug}`}
                          target="_blank"
                          className="hover:text-[#A0630F] hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>{cat.nama}</span>
                          <ExternalLink className="h-3 w-3 text-[#5F7A84] opacity-50" />
                        </Link>
                      </td>

                      {/* Slug URL */}
                      <td className="py-3.5 px-4 font-mono text-[#5F7A84]">
                        /kategori/{cat.slug}
                      </td>

                      {/* Jumlah Alat */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAFAF8] border border-[#E8E8E1] text-[#234E5C]">
                          {cat.equipment_count || 0} alat
                        </span>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(cat)}
                            className="h-8 w-8 p-0 text-[#234E5C] hover:bg-[#F3F3EF]"
                            title="Edit Kategori"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat)}
                            className="h-8 w-8 p-0 text-[#991B1B] hover:bg-[#FEE2E2]"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#5F7A84]">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm">Tidak ada kategori yang cocok.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL FORM CREATE / EDIT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-3">
              {editingId ? "Edit Kategori Perlengkapan" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#234E5C]">
                Nama Kategori <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                required
                placeholder="Contoh: Audio & Sound System"
                value={nama}
                onChange={(e) => handleNamaChange(e.target.value)}
                className="h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Slug URL
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCustomSlug(!isCustomSlug)}
                  className="text-[11px] font-bold text-[#A0630F] hover:underline"
                >
                  {isCustomSlug ? "Kunci Otomatis" : "Ubah Manual"}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-[#5F7A84]">/kategori/</span>
                <Input
                  value={slug}
                  disabled={!isCustomSlug && !editingId}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="audio-sound"
                  className="h-9 text-xs font-mono flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#234E5C]">
                Nomor Urutan Tampilan
              </Label>
              <Input
                type="number"
                min={1}
                value={urutan}
                onChange={(e) => setUrutan(e.target.value)}
                className="h-10 text-xs font-bold w-24"
              />
              <span className="text-[10px] text-[#5F7A84] block">
                Menentukan urutan ikon kategori di beranda (1 = paling depan)
              </span>
            </div>

            {/* Pilihan Ikon */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#234E5C]">
                Pilih Ikon Lucide Kategori
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSel = ikon === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setIkon(item.key)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSel
                          ? "bg-[#234E5C] text-white border-[#234E5C] shadow-xs"
                          : "bg-[#FAFAF8] text-[#5F7A84] border-[#E8E8E1] hover:text-[#234E5C] hover:bg-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-[10px] font-bold truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#E8E8E1] pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="warm"
                size="sm"
                disabled={isSubmitting}
                className="text-xs font-bold px-6"
              >
                {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCategoryManager;
