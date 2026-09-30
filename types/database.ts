export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";

export type BookingStatus =
  | "menunggu_dp"
  | "dp_dibayar"
  | "lunas"
  | "diambil"
  | "terlambat"
  | "dikembalikan"
  | "bermasalah"
  | "selesai"
  | "dibatalkan";

export type PaymentJenis =
  | "dp"
  | "pelunasan"
  | "deposit"
  | "denda"
  | "refund_deposit";

export type PaymentStatus =
  | "menunggu_verifikasi"
  | "terverifikasi"
  | "ditolak";

export type DamageJenis = "rusak_ringan" | "rusak_berat" | "hilang";

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          key: string;
          value: string;
          deskripsi: string | null;
        };
        Insert: {
          key: string;
          value: string;
          deskripsi?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          deskripsi?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          nama: string;
          no_hp: string;
          alamat: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          nama: string;
          no_hp: string;
          alamat?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          no_hp?: string;
          alamat?: string | null;
          role?: UserRole;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          nama: string;
          slug: string;
          ikon: string;
          urutan: number;
        };
        Insert: {
          id?: number;
          nama: string;
          slug: string;
          ikon: string;
          urutan?: number;
        };
        Update: {
          id?: number;
          nama?: string;
          slug?: string;
          ikon?: string;
          urutan?: number;
        };
      };
      equipment: {
        Row: {
          id: number;
          category_id: number;
          nama: string;
          slug: string;
          deskripsi: string | null;
          spesifikasi: Record<string, string | number | boolean> | null;
          harga_per_hari: number;
          harga_mingguan: number | null;
          deposit: number;
          stok: number;
          stok_rusak: number;
          aktif: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          category_id: number;
          nama: string;
          slug: string;
          deskripsi?: string | null;
          spesifikasi?: Record<string, string | number | boolean> | null;
          harga_per_hari: number;
          harga_mingguan?: number | null;
          deposit?: number;
          stok?: number;
          stok_rusak?: number;
          aktif?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          category_id?: number;
          nama?: string;
          slug?: string;
          deskripsi?: string | null;
          spesifikasi?: Record<string, string | number | boolean> | null;
          harga_per_hari?: number;
          harga_mingguan?: number | null;
          deposit?: number;
          stok?: number;
          stok_rusak?: number;
          aktif?: boolean;
          created_at?: string;
        };
      };
      equipment_images: {
        Row: {
          id: number;
          equipment_id: number;
          url: string;
          urutan: number;
          is_utama: boolean;
        };
        Insert: {
          id?: number;
          equipment_id: number;
          url: string;
          urutan?: number;
          is_utama?: boolean;
        };
        Update: {
          id?: number;
          equipment_id?: number;
          url?: string;
          urutan?: number;
          is_utama?: boolean;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          kode_booking: string;
          status: BookingStatus;
          tanggal_mulai: string;
          tanggal_selesai: string;
          total_harga: number;
          deposit: number;
          dp_jumlah: number;
          tanggal_diambil: string | null;
          catatan_penyewa: string | null;
          pesan_admin: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kode_booking?: string;
          status?: BookingStatus;
          tanggal_mulai: string;
          tanggal_selesai: string;
          total_harga: number;
          deposit: number;
          dp_jumlah: number;
          tanggal_diambil?: string | null;
          catatan_penyewa?: string | null;
          pesan_admin?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kode_booking?: string;
          status?: BookingStatus;
          tanggal_mulai?: string;
          tanggal_selesai?: string;
          total_harga?: number;
          deposit?: number;
          dp_jumlah?: number;
          tanggal_diambil?: string | null;
          catatan_penyewa?: string | null;
          pesan_admin?: string | null;
          created_at?: string;
        };
      };
      booking_items: {
        Row: {
          id: number;
          booking_id: string;
          equipment_id: number;
          qty: number;
          harga_per_hari: number;
          subtotal: number;
        };
        Insert: {
          id?: number;
          booking_id: string;
          equipment_id: number;
          qty: number;
          harga_per_hari: number;
          subtotal: number;
        };
        Update: {
          id?: number;
          booking_id?: string;
          equipment_id?: number;
          qty?: number;
          harga_per_hari?: number;
          subtotal?: number;
        };
      };
      booking_status_history: {
        Row: {
          id: number;
          booking_id: string;
          status_lama: BookingStatus | null;
          status_baru: BookingStatus;
          created_at: string;
        };
        Insert: {
          id?: number;
          booking_id: string;
          status_lama?: BookingStatus | null;
          status_baru: BookingStatus;
          created_at?: string;
        };
        Update: {
          id?: number;
          booking_id?: string;
          status_lama?: BookingStatus | null;
          status_baru?: BookingStatus;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: number;
          booking_id: string;
          jenis: PaymentJenis;
          jumlah: number;
          metode: string;
          bukti_url: string | null;
          status: PaymentStatus;
          dibayar_pada: string;
          diverifikasi_oleh: string | null;
        };
        Insert: {
          id?: number;
          booking_id: string;
          jenis: PaymentJenis;
          jumlah: number;
          metode: string;
          bukti_url?: string | null;
          status?: PaymentStatus;
          dibayar_pada?: string;
          diverifikasi_oleh?: string | null;
        };
        Update: {
          id?: number;
          booking_id?: string;
          jenis?: PaymentJenis;
          jumlah?: number;
          metode?: string;
          bukti_url?: string | null;
          status?: PaymentStatus;
          dibayar_pada?: string;
          diverifikasi_oleh?: string | null;
        };
      };
      booking_returns: {
        Row: {
          id: number;
          booking_id: string;
          tanggal_dikembalikan: string;
          hari_terlambat: number;
          denda_terlambat: number;
          total_ganti_rugi: number;
          deposit_dikembalikan: number;
          catatan: string | null;
        };
        Insert: {
          id?: number;
          booking_id: string;
          tanggal_dikembalikan?: string;
          hari_terlambat?: number;
          denda_terlambat?: number;
          total_ganti_rugi?: number;
          deposit_dikembalikan?: number;
          catatan?: string | null;
        };
        Update: {
          id?: number;
          booking_id?: string;
          tanggal_dikembalikan?: string;
          hari_terlambat?: number;
          denda_terlambat?: number;
          total_ganti_rugi?: number;
          deposit_dikembalikan?: number;
          catatan?: string | null;
        };
      };
      damage_reports: {
        Row: {
          id: number;
          booking_item_id: number;
          return_id: number;
          jenis: DamageJenis;
          jumlah: number;
          deskripsi: string;
          biaya_ganti_rugi: number;
          foto_url: string | null;
        };
        Insert: {
          id?: number;
          booking_item_id: number;
          return_id: number;
          jenis: DamageJenis;
          jumlah: number;
          deskripsi: string;
          biaya_ganti_rugi: number;
          foto_url?: string | null;
        };
        Update: {
          id?: number;
          booking_item_id?: number;
          return_id?: number;
          jenis?: DamageJenis;
          jumlah?: number;
          deskripsi?: string;
          biaya_ganti_rugi?: number;
          foto_url?: string | null;
        };
      };
      admin_logs: {
        Row: {
          id: number;
          admin_id: string;
          aksi: string;
          nama_tabel: string;
          target_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          admin_id: string;
          aksi: string;
          nama_tabel: string;
          target_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          admin_id?: string;
          aksi?: string;
          nama_tabel?: string;
          target_id?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      sisa_stok: {
        Args: {
          p_equipment_id: number;
          p_mulai: string;
          p_selesai: string;
        };
        Returns: number;
      };
      tanggal_penuh: {
        Args: {
          p_equipment_id: number;
          p_dari: string;
          p_sampai: string;
        };
        Returns: string[];
      };
      create_booking: {
        Args: {
          p_mulai: string;
          p_selesai: string;
          p_items: { equipment_id: number; qty: number }[];
          p_catatan?: string | null;
        };
        Returns: string;
      };
      batalkan_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: void;
      };
      terima_pengembalian: {
        Args: {
          p_booking_id: string;
          p_tanggal: string;
          p_catatan?: string | null;
          p_kerusakan?: {
            booking_item_id: number;
            jenis: DamageJenis;
            jumlah: number;
            deskripsi: string;
            biaya_ganti_rugi: number;
            foto_url?: string | null;
          }[];
        };
        Returns: number;
      };
      tandai_terlambat: {
        Args: Record<string, never>;
        Returns: number;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}

// Convenience Type Aliases
export type Setting = Database["public"]["Tables"]["settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type EquipmentItem = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentImage = Database["public"]["Tables"]["equipment_images"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingItem = Database["public"]["Tables"]["booking_items"]["Row"];
export type BookingStatusHistory = Database["public"]["Tables"]["booking_status_history"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type BookingReturn = Database["public"]["Tables"]["booking_returns"]["Row"];
export type DamageReport = Database["public"]["Tables"]["damage_reports"]["Row"];
export type AdminLog = Database["public"]["Tables"]["admin_logs"]["Row"];

export type EquipmentWithDetails = EquipmentItem & {
  category?: Category | null;
  images?: EquipmentImage[];
};
