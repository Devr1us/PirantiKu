import { AnimatedText } from "@/components/ui/motion";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex-1 space-y-6">
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <AnimatedText
          text={title.toUpperCase()}
          mode="word"
          as="h1"
          className="section-title block"
        />
        <p className="text-sm text-[#5F7A84] font-medium">{description}</p>
      </div>

      <div className="rounded-xl border border-[#E8E8E1] bg-white p-8 sm:p-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-[#234E5C]">
          Modul {title} sedang dalam pengembangan operasional.
        </p>
        <p className="text-xs text-[#5F7A84] mt-1 max-w-md mx-auto">
          Fitur ini akan terhubung langsung dengan sistem database dan pengelolaan inventaris toko PirantiKu.
        </p>
      </div>
    </div>
  );
}
