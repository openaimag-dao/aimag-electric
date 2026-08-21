"use client";

import * as React from "react";
import { ImageOff, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-fields";
import {
  getProductImages,
  createProductImage,
  deleteProductImage,
  uploadProductImageFile,
} from "@/server/actions/admin";

interface ImageRow {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

/**
 * Inline photo manager embedded in the product edit dialog — current photos
 * next to the rest of the form, no separate screen. Supports both a real
 * file upload (drag-drop or picker, to Vercel Blob) and adding by URL for
 * photos already hosted elsewhere.
 */
export function ProductPhotosPanel({ productId }: { productId: string }) {
  const [images, setImages] = React.useState<ImageRow[] | null>(null);
  const [newUrl, setNewUrl] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    let successCount = 0;
    let nextOrder = images?.length ?? 0;
    for (const file of fileArray) {
      const formData = new FormData();
      formData.set("file", file);
      const uploadResult = await uploadProductImageFile(formData);
      if (!uploadResult.ok || !uploadResult.data) {
        toast.error(`${file.name}: ${uploadResult.error ?? "не удалось загрузить"}`);
        continue;
      }
      const result = await createProductImage({
        productId,
        url: uploadResult.data.url,
        alt: "",
        order: nextOrder,
      });
      if (result.ok) {
        successCount++;
        nextOrder++;
      } else {
        toast.error(`${file.name}: ${result.error ?? "не удалось сохранить"}`);
      }
    }
    setUploading(false);
    if (successCount > 0) {
      toast.success(`Загружено фото: ${successCount}`);
      refresh();
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
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

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`mb-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
          dragActive ? "border-signal bg-signal/5" : "border-border"
        }`}
      >
        {images === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Загрузка…
          </div>
        ) : images.length === 0 && !uploading ? (
          <p className="text-sm text-muted-foreground">
            Пока нет фото. Перетащите файлы сюда или загрузите ниже.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {images?.map((img) => (
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
            {uploading && (
              <div className="flex size-20 items-center justify-center rounded-lg border border-dashed border-signal text-signal">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <Button
          type="button"
          variant="signal"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Загрузить файл
        </Button>
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="или вставьте ссылку на фото"
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
