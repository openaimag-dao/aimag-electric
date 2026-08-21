"use client";

import * as React from "react";
import { ImageOff, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-fields";
import { getProductImages, createProductImage, deleteProductImage } from "@/server/actions/admin";

interface ImageRow {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

/**
 * Inline photo manager embedded in the product edit dialog — current photos
 * next to the rest of the form, add by URL, delete, no separate screen.
 * Same URL-based pattern as the rest of the admin (documents, categories):
 * paste a link, no file upload — there's no storage provider wired up yet.
 */
export function ProductPhotosPanel({ productId }: { productId: string }) {
  const [images, setImages] = React.useState<ImageRow[] | null>(null);
  const [newUrl, setNewUrl] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setImages(await getProductImages(productId));
  }, [productId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd() {
    const url = newUrl.trim();
    if (!url) return;
    setAdding(true);
    const result = await createProductImage({
      productId,
      url,
      alt: "",
      order: images?.length ?? 0,
    });
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось добавить фото");
      return;
    }
    setNewUrl("");
    toast.success("Фото добавлено");
    refresh();
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    const result = await deleteProductImage(id);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось удалить фото");
      return;
    }
    refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <p className="mb-3 text-sm font-medium text-primary">Фото товара</p>

      {images === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Загрузка…
        </div>
      ) : images.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">Пока нет фото.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, admin thumbnail only
                <img
                  src={img.url}
                  alt=""
                  className="size-20 rounded-lg border border-border object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <ImageOff className="size-5" />
                </div>
              )}
              {img.order === 0 && (
                <span className="absolute left-1 top-1 rounded bg-signal px-1.5 py-0.5 text-[10px] font-bold text-steel-950">
                  Главное
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={removingId === img.id}
                aria-label="Удалить фото"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition-opacity disabled:opacity-60 group-hover:opacity-100"
              >
                {removingId === img.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://... — ссылка на фото"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={adding || !newUrl.trim()}
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Добавить
        </Button>
      </div>
    </div>
  );
}
