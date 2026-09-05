"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCartAsProject } from "@/server/actions/project-actions";
import { track } from "@/lib/analytics";
import type { CartItem } from "@/types/cart";

/** Persists the current cart as a named, saved Project — the cart itself stays untouched (client-side, ephemeral). */
export function SaveAsProjectButton({ items }: { items: CartItem[] }) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  if (status !== "authenticated") {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <Link
          href="/login?callbackUrl=/cart"
          className="font-medium text-signal-700 hover:underline"
        >
          Войдите
        </Link>
        , чтобы сохранить этот проект и вернуться к нему позже.
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <FolderPlus className="size-4" />
        Сохранить как проект
      </Button>
    );
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    const result = await saveCartAsProject({
      title: trimmed,
      items: items.map((i) => ({
        productId: i.productId,
        slug: i.slug,
        sku: i.sku,
        title: i.title,
        qty: i.qty,
        unit: i.unit,
        priceTenge: i.priceTenge,
      })),
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось сохранить проект");
      return;
    }
    track("save_as_project", { itemCount: items.length });
    toast.success("Проект сохранён");
    router.push(`/account/projects/${result.data.id}`);
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <Input
        autoFocus
        placeholder="Название проекта, напр. «Объект №1»"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
        }}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          Отмена
        </Button>
        <Button
          type="button"
          variant="signal"
          className="flex-1"
          onClick={handleSave}
          disabled={saving || !title.trim()}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
}
