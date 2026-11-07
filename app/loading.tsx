export default function Loading() {
  return (
    <div className="flex-1 w-full flex items-center justify-center min-h-[60vh] bg-[#FAFAF8] px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-3 border-[#234E5C]/20 border-t-[#234E5C] animate-spin" />
          <div className="absolute h-4 w-4 rounded-full bg-[#A0630F] animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-serif font-bold text-lg text-[#234E5C] tracking-tight">
            PirantiKu
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#5F7A84]">
            Memuat data...
          </span>
        </div>
      </div>
    </div>
  );
}

