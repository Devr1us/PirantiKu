import Link from "next/link";
import { Layers, Phone, Clock, ShieldCheck, Heart } from "lucide-react";
import { APP_NAME, TAGLINE, DEFAULT_SETTINGS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function Footer() {
  let whatsapp = DEFAULT_SETTINGS.whatsapp_admin;
  let jamOperasional = DEFAULT_SETTINGS.jam_operasional;

  try {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value");

    if (settings) {
      settings.forEach((s) => {
        if (s.key === "whatsapp_admin" && s.value) whatsapp = s.value;
        if (s.key === "jam_operasional" && s.value) jamOperasional = s.value;
      });
    }
  } catch {
    // Gunakan fallback
  }

  const cleanWa = whatsapp.replace(/[^0-9]/g, "");

  return (
    <footer className="w-full border-t border-border bg-card/60 text-card-foreground backdrop-blur-sm transition-colors mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand info */}
          <div className="flex flex-col space-y-4 md:col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground shadow-md shadow-primary/20">
                <Layers className="h-5 w-5" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm font-medium text-primary">
              {TAGLINE}
            </p>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Platform booking sewa alat serba ada dengan kepastian stok real-time,
              DP ringan, dan jaminan alat selalu siap pakai dalam kondisi prima.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Penyewaan aman, terpercaya & transparan</span>
            </div>
          </div>

          {/* Navigasi Cepat */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-foreground uppercase">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/alat" className="hover:text-primary transition-colors">
                  Katalog Alat Lengkap
                </Link>
              </li>
              <li>
                <Link href="/keranjang" className="hover:text-primary transition-colors">
                  Keranjang Sewa
                </Link>
              </li>
              <li>
                <Link href="/booking-saya" className="hover:text-primary transition-colors">
                  Cek Status Booking
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-primary transition-colors text-xs text-muted-foreground/60">
                  Akses Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Layanan & Bantuan */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-foreground uppercase">
              Bantuan & CS
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">Jam Operasional:</span>
                  <span className="text-xs leading-relaxed">{jamOperasional}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-accent-warm shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">WhatsApp Admin:</span>
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    +{cleanWa}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-border pt-6 sm:flex-row gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} {APP_NAME}. Hak Cipta Dilindungi.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Dibuat dengan <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> untuk kemudahan penyewaan alat
          </p>
        </div>
      </div>
    </footer>
  );
}
