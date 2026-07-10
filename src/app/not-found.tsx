import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-steel-950 text-signal">
        <SearchX className="size-8" />
      </div>
      <p className="font-mono text-sm font-medium text-signal-700">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-primary">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Возможно, товар снят с продажи или ссылка устарела. Проверьте адрес или вернитесь в каталог.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-steel-950 hover:bg-signal-400">
          <ArrowLeft className="size-4" /> На главную
        </Link>
        <Link href="/catalog" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-primary hover:bg-secondary">
          Открыть каталог
        </Link>
      </div>
    </div>
  );
}
