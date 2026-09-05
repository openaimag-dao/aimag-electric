"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { getSharedCart } from "@/server/actions";

/**
 * Landing target for a shared cart link (/cart/s/[code]) — resolves the
 * share server-side (fresh prices, drops anything unpublished since the
 * link was made), loads it into this browser's cart, then redirects to
 * /cart. A client component because localStorage-backed cart state only
 * exists on the client.
 */
export function SharedCartLoader({ code }: { code: string }) {
  const router = useRouter();
  const { loadItems } = useCart();
  const [error, setError] = React.useState<string | null>(null);
  const requested = React.useRef(false);

  React.useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    (async () => {
      const result = await getSharedCart(code);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Не удалось открыть проект");
        return;
      }
      if (result.data.items.length === 0) {
        setError("Ни одной позиции из этой ссылки больше нет в каталоге");
        return;
      }
      loadItems(result.data.items);
      if (result.data.droppedCount > 0) {
        toast.info(
          `${result.data.droppedCount} позиц. из ссылки больше недоступны и не были добавлены`
        );
      }
      router.replace("/cart");
    })();
  }, [code, loadItems, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
        <TriangleAlert className="size-10 text-muted-foreground" />
        <div>
          <p className="font-display text-lg font-semibold text-primary">Ссылка недействительна</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button asChild variant="signal">
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
      <p>Открываем проект…</p>
    </div>
  );
}
