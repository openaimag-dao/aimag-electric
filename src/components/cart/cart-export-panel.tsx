"use client";

import * as React from "react";
import { FileSpreadsheet, FileText, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadBase64Xlsx, downloadBase64Pdf } from "@/lib/admin/download-file";
import { exportCartXlsx, exportCartPdf, shareCart } from "@/server/actions";
import type { CartItem } from "@/types/cart";

/** Export/share actions for the current cart — spec sheet (xlsx/PDF) and a shareable short link. */
export function CartExportPanel({ items }: { items: CartItem[] }) {
  const [exporting, setExporting] = React.useState<"xlsx" | "pdf" | null>(null);
  const [sharing, setSharing] = React.useState(false);

  function refs() {
    return items.map((i) => ({ productId: i.productId, qty: i.qty }));
  }

  async function handleExportXlsx() {
    setExporting("xlsx");
    const result = await exportCartXlsx(refs());
    setExporting(null);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось экспортировать");
      return;
    }
    downloadBase64Xlsx(result.data.base64, result.data.filename);
    if (result.data.droppedCount > 0) {
      toast.info(`${result.data.droppedCount} позиц. пропущены — их больше нет в каталоге`);
    }
  }

  async function handleExportPdf() {
    setExporting("pdf");
    const result = await exportCartPdf(refs());
    setExporting(null);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось экспортировать");
      return;
    }
    downloadBase64Pdf(result.data.base64, result.data.filename);
    if (result.data.droppedCount > 0) {
      toast.info(`${result.data.droppedCount} позиц. пропущены — их больше нет в каталоге`);
    }
  }

  async function handleShare() {
    setSharing(true);
    const result = await shareCart(items);
    setSharing(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось создать ссылку");
      return;
    }
    const url = `${window.location.origin}/cart/s/${result.data.code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована — можно отправить коллеге");
    } catch {
      toast.success("Ссылка на проект: " + url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportXlsx}
        disabled={exporting !== null}
      >
        {exporting === "xlsx" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="size-4" />
        )}
        Скачать Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={exporting !== null}
      >
        {exporting === "pdf" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        Скачать PDF
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleShare} disabled={sharing}>
        {sharing ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
        Поделиться ссылкой
      </Button>
    </div>
  );
}
