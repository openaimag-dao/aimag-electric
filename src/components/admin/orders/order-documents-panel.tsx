"use client";

import * as React from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/admin/form-fields";
import { orderDocumentKindMeta, orderDocumentKindOrder } from "@/config/order-meta";
import {
  uploadOrderDocumentFile,
  addOrderDocument,
  removeOrderDocument,
} from "@/server/actions/admin";

export interface OrderDocumentRow {
  id: string;
  title: string;
  kind: string;
  url: string;
  size: string | null;
}

export function OrderDocumentsPanel({
  orderId,
  initialDocuments,
}: {
  orderId: string;
  initialDocuments: OrderDocumentRow[];
}) {
  const [documents, setDocuments] = React.useState(initialDocuments);
  const [uploading, setUploading] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [pendingKind, setPendingKind] = React.useState("OTHER");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const uploadResult = await uploadOrderDocumentFile(formData);
    if (!uploadResult.ok || !uploadResult.data) {
      setUploading(false);
      toast.error(uploadResult.error ?? "Не удалось загрузить файл");
      return;
    }
    const result = await addOrderDocument(orderId, {
      title: file.name,
      kind: pendingKind,
      url: uploadResult.data.url,
      size: uploadResult.data.size,
    });
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось сохранить документ");
      return;
    }
    setDocuments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: file.name,
        kind: pendingKind,
        url: uploadResult.data!.url,
        size: uploadResult.data!.size,
      },
    ]);
    toast.success("Документ добавлен");
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    const result = await removeOrderDocument(id);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось удалить документ");
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-3">
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Документов пока нет.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {orderDocumentKindMeta[doc.kind] ?? doc.kind}
                    {doc.size && ` · ${doc.size}`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button asChild variant="ghost" size="icon" className="size-8">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label="Скачать">
                    <Download className="size-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-red-600"
                  onClick={() => handleRemove(doc.id)}
                  disabled={removingId === doc.id}
                  aria-label="Удалить"
                >
                  {removingId === doc.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          value={pendingKind}
          onChange={(e) => setPendingKind(e.target.value)}
          className="h-9 w-auto"
        >
          {orderDocumentKindOrder.map((k) => (
            <option key={k} value={k}>
              {orderDocumentKindMeta[k]}
            </option>
          ))}
        </NativeSelect>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={handleFileSelected}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Загрузить файл
        </Button>
      </div>
    </div>
  );
}
