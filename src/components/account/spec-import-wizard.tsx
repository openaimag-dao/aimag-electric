"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  matchSpecificationFile,
  type SpecMatchSummary,
} from "@/server/actions/spec-import-actions";
import type { MatchedSpecRow } from "@/server/services/spec-match-service";
import { saveCartAsProject } from "@/server/actions/project-actions";
import { formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";

const TIER_META: Record<
  MatchedSpecRow["result"]["tier"],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  exact: {
    label: "Точное совпадение",
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  possible: {
    label: "Возможное совпадение",
    className: "bg-amber-50 text-amber-700",
    icon: HelpCircle,
  },
  not_found: {
    label: "Не найдено",
    className: "bg-secondary text-muted-foreground",
    icon: XCircle,
  },
};

type Step = "upload" | "review";

export function SpecImportWizard() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [step, setStep] = React.useState<Step>("upload");
  const [uploading, setUploading] = React.useState(false);
  const [summary, setSummary] = React.useState<SpecMatchSummary | null>(null);
  const [rows, setRows] = React.useState<MatchedSpecRow[]>([]);
  const [selections, setSelections] = React.useState<Record<number, string | null>>({});
  const [title, setTitle] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await matchSpecificationFile(formData);
    setUploading(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось обработать файл");
      return;
    }
    setSummary(result.data.summary);
    setRows(result.data.rows);
    const initial: Record<number, string | null> = {};
    for (const row of result.data.rows) {
      initial[row.row] =
        row.result.tier === "exact" ? (row.result.candidates[0]?.product.id ?? null) : null;
    }
    setSelections(initial);
    setTitle(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));
    setStep("review");
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  const confirmedCount = Object.values(selections).filter(Boolean).length;

  async function handleCreateProject() {
    if (!title.trim()) {
      toast.error("Укажите название проекта");
      return;
    }
    const items = rows
      .map((row) => {
        const productId = selections[row.row];
        if (!productId) return null;
        const candidate = row.result.candidates.find((c) => c.product.id === productId);
        if (!candidate) return null;
        return {
          productId: candidate.product.id,
          slug: candidate.product.slug,
          sku: candidate.product.sku,
          title: candidate.product.title,
          qty: row.qty,
          unit: candidate.product.unit,
          priceTenge: candidate.product.price,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    if (items.length === 0) {
      toast.error("Подтвердите хотя бы одно совпадение");
      return;
    }

    setCreating(true);
    const result = await saveCartAsProject({ title: title.trim(), items });
    setCreating(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Не удалось создать проект");
      return;
    }
    toast.success(`Проект создан: ${items.length} позиций`);
    router.push(`/account/projects/${result.data.id}`);
  }

  if (step === "upload") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
          <Upload className="size-7" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold text-primary">
          Выберите файл спецификации
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Колонки: артикул (опц.), наименование, количество, единица, производитель. Заголовки на
          русском или английском — определим автоматически.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFileInputChange}
        />
        <Button
          className="mt-6"
          variant="signal"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "Обрабатываем…" : "Выбрать файл"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Всего позиций</p>
            <p className="font-display text-xl font-bold text-primary">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Точных</p>
            <p className="font-display text-xl font-bold text-emerald-700">{summary.exact}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Возможных</p>
            <p className="font-display text-xl font-bold text-amber-700">{summary.possible}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Не найдено</p>
            <p className="font-display text-xl font-bold text-muted-foreground">
              {summary.notFound}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row) => {
          const meta = TIER_META[row.result.tier];
          const Icon = meta.icon;
          return (
            <div key={row.row} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Строка {row.row}</p>
                  <p className="font-medium text-primary">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.sku && `Арт. ${row.sku} · `}
                    {row.qty} {row.unit}
                    {row.manufacturer && ` · ${row.manufacturer}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    meta.className
                  )}
                >
                  <Icon className="size-3" />
                  {meta.label}
                </span>
              </div>

              {row.result.tier === "not_found" ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="size-3.5" />
                  Подходящий товар в каталоге не найден — позиция не будет добавлена в проект.
                </p>
              ) : (
                <div className="mt-3 space-y-1.5">
                  {row.result.candidates.map((c) => (
                    <label
                      key={c.product.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-secondary/50"
                    >
                      <input
                        type="radio"
                        name={`row-${row.row}`}
                        checked={selections[row.row] === c.product.id}
                        onChange={() =>
                          setSelections((prev) => ({ ...prev, [row.row]: c.product.id }))
                        }
                        className="size-4"
                      />
                      <Link
                        href={`/catalog/${c.product.slug}`}
                        target="_blank"
                        className="text-sm text-primary hover:text-signal-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.product.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {c.product.sku} ·{" "}
                        {c.product.price !== null ? formatTenge(c.product.price) : "по запросу"}
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm text-muted-foreground hover:bg-secondary/50">
                    <input
                      type="radio"
                      name={`row-${row.row}`}
                      checked={selections[row.row] == null}
                      onChange={() => setSelections((prev) => ({ ...prev, [row.row]: null }))}
                      className="size-4"
                    />
                    Не добавлять
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название проекта"
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">
          Будет добавлено: {confirmedCount} из {rows.length}
        </span>
        <Button
          variant="signal"
          className="ml-auto"
          onClick={handleCreateProject}
          disabled={creating || confirmedCount === 0}
        >
          {creating && <Loader2 className="size-4 animate-spin" />}
          Создать проект
        </Button>
      </div>
    </div>
  );
}
