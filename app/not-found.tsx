import Link from "next/link";
import { Button } from "@/components/ui/button";
import { H1, Lead } from "@/components/ui/typography";
import { Reveal } from "@/components/ui/motion";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-24 sm:py-32 flex flex-col items-center justify-center text-center space-y-6">
      <span className="text-6xl sm:text-8xl font-black text-[#A0630F] tracking-tight">
        404
      </span>
      <div className="space-y-2 max-w-md">
        <H1 className="text-2xl sm:text-3xl font-extrabold text-[#234E5C]">
          HALAMAN TIDAK DITEMUKAN
        </H1>
        <Lead className="text-sm sm:text-base text-[#5F7A84]">
          Halaman yang Anda tuju mungkin telah dipindahkan atau sudah tidak tersedia di PirantiKu.
        </Lead>
      </div>
      <Reveal delay={0.1}>
        <Link href="/">
          <Button
            variant="petrol"
            size="lg"
            className="px-8 text-xs font-bold uppercase tracking-wider"
          >
            Kembali ke Beranda
          </Button>
        </Link>
      </Reveal>
    </div>
  );
}
