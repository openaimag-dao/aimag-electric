import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

import { getPublicQuote } from "@/server/actions/quote-response-actions";
import { QuoteResponseActions } from "@/components/quote/quote-response-actions";
import { formatTiyn } from "@/lib/money";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Коммерческое предложение",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

function quoteTotalTiyn(items: { amountTiyn: number | null; qty: number }[]): number {
  return items.reduce((sum, i) => sum + (i.amountTiyn ?? 0) * i.qty, 0);
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const quote = await getPublicQuote(token);
  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-secondary/20">
      <div className="container max-w-2xl py-10">
        <p className="text-center text-sm font-medium text-muted-foreground">{siteConfig.name}</p>
        <h1 className="mt-2 text-center font-display text-2xl font-bold text-primary">
          {quote.title || "Коммерческое предложение"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">для «{quote.company}»</p>

        <div className="mt-6 rounded-xl border border-border bg-card">
          {quote.items.length > 0 ? (
            <>
              <div className="divide-y divide-border">
                {quote.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku && <>Арт. {item.sku} · </>}
                        {item.qty} {item.unit}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {item.amountTiyn !== null
                        ? formatTiyn(item.amountTiyn * item.qty)
                        : "по запросу"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border bg-secondary/40 p-4">
                <span className="text-sm text-muted-foreground">Итого</span>
                <span className="font-display text-xl font-bold text-primary">
                  {formatTiyn(quoteTotalTiyn(quote.items))}
                </span>
              </div>
            </>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Позиции уточняются менеджером.</p>
          )}
        </div>

        <div className="mt-6">
          {quote.status === "SENT" && <QuoteResponseActions token={token} />}

          {quote.status === "WON" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
              Вы одобрили это предложение
              {quote.respondedAt && ` ${new Date(quote.respondedAt).toLocaleDateString("ru-RU")}`}.
              {quote.responseNote && (
                <p className="mt-2 text-emerald-800">«{quote.responseNote}»</p>
              )}
            </div>
          )}

          {quote.status === "LOST" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              Это предложение отклонено
              {quote.respondedAt && ` ${new Date(quote.respondedAt).toLocaleDateString("ru-RU")}`}.
              {quote.responseNote && <p className="mt-2 text-red-800">«{quote.responseNote}»</p>}
            </div>
          )}

          {(quote.status === "NEW" || quote.status === "IN_PROGRESS") && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              <Clock className="size-4" /> Предложение готовится — ссылка станет активной, как
              только менеджер его отправит.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
