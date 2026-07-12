"use client";

import * as React from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseSheet, buildTemplateWorkbook, rowsToWorkbook } from "@/lib/import/parse-sheet";
import { buildPreview, type ImportContext } from "@/lib/import/validators";
import { IMPORT_COLUMNS, importTemplate } from "@/config/import-columns";
import {
  IMPORT_KIND_LABELS,
  type ImportKind,
  type ImportPreview,
  type ImportResult,
} from "@/types/import";
import { applyImport, getImportContext } from "@/server/actions/admin";
import { ImportKindPicker } from "@/components/admin/import/import-kind-picker";
import { ImportPreviewTable } from "@/components/admin/import/import-preview-table";
import { ImportSummaryBar } from "@/components/admin/import/import-summary-bar";

type RawCtx = Awaited<ReturnType<typeof getImportContext>>;

function toContext(raw: RawCtx): ImportContext {
  return {
    categorySlugs: new Set(raw.categories.map((c) => c.slug)),
    categoryTitleToSlug: new Map(raw.categories.map((c) => [c.title.toLowerCase(), c.slug])),
    brandSlugs: new Set(raw.brands.map((b) => b.slug)),
    brandNameToSlug: new Map(raw.brands.map((b) => [b.name.toLowerCase(), b.slug])),
    productSkus: new Set(raw.products.map((p) => p.sku)),
    warehouseCodes: new Set(raw.warehouses.map((w) => w.code)),
    warehouseNameToCode: new Map(raw.warehouses.map((w) => [w.name.toLowerCase(), w.code])),
  };
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportClient() {
  const [kind, setKind] = React.useState<ImportKind | null>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setRawRows([]);
    setFileName("");
    setResult(null);
  };

  async function handleFile(file: File) {
    if (!kind) return;
    setParsing(true);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSheet(buffer, kind);

      if (parsed.missingRequired.length > 0) {
        toast.error(`Не найдены обязательные колонки: ${parsed.missingRequired.join(", ")}`);
        setParsing(false);
        return;
      }
      if (parsed.rows.length === 0) {
        toast.error("Файл пуст или не содержит строк данных");
        setParsing(false);
        return;
      }

      const raw = await getImportContext();
      const ctx = toContext(raw);
      const pv = buildPreview(kind, parsed.rows, parsed.sourceColumns, file.name, ctx);
      setRawRows(parsed.rows);
      setPreview(pv);
      setFileName(file.name);
      toast.success(`Разобрано строк: ${pv.totalRows}`);
    } catch {
      toast.error("Не удалось прочитать файл. Проверьте формат (xlsx/xls/csv).");
    } finally {
      setParsing(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function downloadTemplate() {
    if (!kind) return;
    const { headers, example } = importTemplate(kind);
    const buffer = buildTemplateWorkbook(kind, headers, example);
    downloadBuffer(buffer, `template-${kind}.xlsx`);
  }

  function downloadErrorLog() {
    if (!preview) return;
    const rows = preview.rows.flatMap((r) =>
      r.issues.map((i) => ({
        Строка: r.row,
        Уровень: i.level === "error" ? "Ошибка" : "Предупреждение",
        Колонка: i.column ?? "",
        Сообщение: i.message,
      }))
    );
    if (rows.length === 0) {
      toast.info("Ошибок и предупреждений нет");
      return;
    }
    downloadBuffer(rowsToWorkbook(rows, "Журнал"), `import-log-${kind}.xlsx`);
  }

  async function handleApply() {
    if (!kind || !preview) return;
    if (preview.counts.create + preview.counts.update === 0) {
      toast.error("Нет строк для импорта");
      return;
    }
    setApplying(true);
    try {
      const res = await applyImport(kind, rawRows, fileName);
      setResult(res);
      if (res.ok) toast.success(res.message ?? "Импорт завершён");
      else toast.error(res.message ?? "Импорт завершён с ошибками");
    } catch {
      toast.error("Ошибка применения импорта");
    } finally {
      setApplying(false);
    }
  }

  // Step 1: pick kind
  if (!kind) {
    return <ImportKindPicker onPick={setKind} />;
  }

  const specs = IMPORT_COLUMNS[kind];
  const canApply = preview && preview.counts.create + preview.counts.update > 0 && !applying;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setKind(null);
              reset();
            }}
          >
            <ArrowLeft className="size-4" /> Тип импорта
          </Button>
          <Badge variant="signal">{IMPORT_KIND_LABELS[kind]}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="size-4" /> Шаблон .xlsx
          </Button>
          {preview && (
            <Button variant="outline" size="sm" onClick={downloadErrorLog}>
              <FileSpreadsheet className="size-4" /> Журнал
            </Button>
          )}
        </div>
      </div>

      {/* Expected columns hint */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="mb-2 text-sm font-medium text-primary">Ожидаемые колонки</p>
        <div className="flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <span
              key={s.key}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                s.required
                  ? "border-signal/40 bg-signal/10 text-steel-800"
                  : "border-border bg-card text-muted-foreground"
              }`}
              title={s.hint}
            >
              {s.label}
              {s.required && <span className="text-signal-700">*</span>}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Заголовки распознаются на русском и английском. Поля со «*» обязательны. Поддержка .xlsx,
          .xls, .csv.
        </p>
      </div>

      {/* Dropzone */}
      {!preview && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? "border-signal bg-signal/5" : "border-border bg-card hover:border-signal/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={onInputChange}
          />
          {parsing ? (
            <Loader2 className="size-10 animate-spin text-signal" />
          ) : (
            <Upload className="size-10 text-steel-400" />
          )}
          <p className="mt-4 font-medium text-primary">
            {parsing ? "Разбираем файл…" : "Перетащите файл или нажмите для выбора"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Excel (.xlsx, .xls) или CSV</p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <ImportSummaryBar preview={preview} fileName={fileName} />

          {result ? (
            <ResultPanel result={result} onReset={reset} />
          ) : (
            <>
              <ImportPreviewTable preview={preview} />

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button variant="outline" onClick={reset} disabled={applying}>
                  <RefreshCw className="size-4" /> Другой файл
                </Button>
                <div className="flex items-center gap-3">
                  {preview.counts.errors > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-red-600">
                      <AlertTriangle className="size-4" />
                      {preview.counts.errors} строк с ошибками будут пропущены
                    </span>
                  )}
                  <Button variant="signal" onClick={handleApply} disabled={!canApply}>
                    {applying && <Loader2 className="size-4 animate-spin" />}
                    Импортировать {preview.counts.create + preview.counts.update}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, onReset }: { result: ImportResult; onReset: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        {result.ok ? (
          <CheckCircle2 className="size-8 text-emerald-600" />
        ) : (
          <XCircle className="size-8 text-red-600" />
        )}
        <div>
          <h3 className="font-display text-lg font-semibold text-primary">
            {result.ok ? "Импорт завершён" : "Импорт завершён с ошибками"}
          </h3>
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultStat label="Создано" value={result.created} className="text-emerald-700" />
        <ResultStat label="Обновлено" value={result.updated} className="text-blue-700" />
        <ResultStat label="Пропущено" value={result.skipped} className="text-muted-foreground" />
        <ResultStat label="Ошибок" value={result.failed} className="text-red-700" />
      </div>

      {result.errors.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-primary">Журнал ошибок</p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
            {result.errors.map((e, i) => (
              <div
                key={i}
                className="flex items-start gap-2 border-b border-border px-3 py-2 text-sm last:border-0"
              >
                <span className="font-mono text-xs text-muted-foreground">стр. {e.row}</span>
                <span className="text-red-600">{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="size-4" /> Новый импорт
        </Button>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
      <div className={`font-display text-2xl font-bold ${className ?? "text-primary"}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
