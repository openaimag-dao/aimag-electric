import { Download, FileText, FileCheck2, FileCog, PenTool } from "lucide-react";

import type { ProductDocument } from "@/types/product-detail";

const kindConfig: Record<
  ProductDocument["kind"],
  { label: string; icon: typeof FileText; tone: string }
> = {
  certificate: { label: "Сертификат", icon: FileCheck2, tone: "text-emerald-600 bg-emerald-50" },
  datasheet: { label: "Паспорт", icon: FileText, tone: "text-signal-700 bg-signal/10" },
  manual: { label: "Инструкция", icon: FileCog, tone: "text-blue-600 bg-blue-50" },
  drawing: { label: "Чертёж", icon: PenTool, tone: "text-purple-600 bg-purple-50" },
};

/** PDF documents & certificates. Each row is a download link. */
export function DocumentList({ documents }: { documents: ProductDocument[] }) {
  if (documents.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {documents.map((doc) => {
        const { label, icon: Icon, tone } = kindConfig[doc.kind];
        return (
          <li key={doc.href}>
            <a
              href={doc.href}
              download
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-signal/60 hover:shadow-sm"
            >
              <span
                className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {label} · PDF · {doc.size}
                </p>
              </div>
              <Download className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-signal-700" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
