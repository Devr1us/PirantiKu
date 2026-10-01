import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { APP_NAME } from "@/lib/constants";

export async function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E8E8E1] text-[#234E5C] mt-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Sisi Kiri: Wordmark & Deskripsi Singkat */}
          <div className="space-y-4 max-w-sm">
            <Wordmark />
            <p className="text-sm text-[#5F7A84] leading-relaxed">
              Layanan penyewaan perlengkapan serba ada dengan transparansi stok,
              proses cepat per tanggal sewa, dan kondisi alat prima siap pakai.
            </p>
          </div>

          {/* Sisi Kanan: Daftar Tautan Vertikal Rapi */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#234E5C]">
                Navigasi Cepat
              </span>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="/" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="/alat" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Katalog
                  </Link>
                </li>
                <li>
                  <Link href="/#cara-sewa" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Cara Sewa
                  </Link>
                </li>
                <li>
                  <Link href="/#kontak" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Kontak
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#234E5C]">
                Akun & Akses
              </span>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="/login" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link href="/daftar" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Daftar
                  </Link>
                </li>
                <li>
                  <Link href="/keranjang" className="text-[#5F7A84] hover:text-[#234E5C] transition-colors">
                    Keranjang Sewa
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="text-xs text-[#5F7A84]/70 hover:text-[#234E5C] transition-colors">
                    Portal Pengelola
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Baris Hak Cipta */}
        <div className="mt-12 pt-6 border-t border-[#E8E8E1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5F7A84] gap-3">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Hak cipta dilindungi undang-undang.</p>
          <p className="text-[11px] text-[#5F7A84]/80">
            Rental alat praktis & transparan untuk segala kebutuhan Anda.
          </p>
        </div>
      </div>
    </footer>
  );
}
