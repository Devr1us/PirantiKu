type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-6 py-16">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-zinc-600">{description}</p>
    </main>
  );
}
