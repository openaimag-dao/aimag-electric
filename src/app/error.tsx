"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console; server logs capture the digest server-side.
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle className="size-8" />
      </div>
      <p className="font-mono text-sm font-medium text-red-600">500</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-primary">Что-то пошло не так</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Произошла непредвиденная ошибка. Мы уже зафиксировали её. Попробуйте обновить страницу.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">код: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-steel-950 hover:bg-signal-400">
          <RefreshCw className="size-4" /> Попробовать снова
        </button>
        <Link href="/" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-primary hover:bg-secondary">
          На главную
        </Link>
      </div>
    </div>
  );
}
