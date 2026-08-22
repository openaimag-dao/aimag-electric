"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/admin/form-dialog";
import { ProjectForm } from "@/components/account/project-form";
import { projectStatusMeta } from "@/config/project-meta";
import { formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface ProjectListRow {
  id: string;
  title: string;
  status: string;
  objectName: string | null;
  companyName: string | null;
  itemCount: number;
  totalTenge: number;
  updatedAt: string;
}

export function ProjectsListClient({ rows }: { rows: ProjectListRow[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} проектов</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/account/projects/import">
              <Upload className="size-4" />
              Загрузить ТЗ
            </Link>
          </Button>
          <Button variant="signal" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Новый проект
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-steel-500">
            <Briefcase className="size-7" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-primary">
            Пока нет проектов
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Соберите товары в каталоге и на странице «Проект» нажмите «Сохранить как проект», или
            создайте пустой проект здесь.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const meta = projectStatusMeta[row.status] ?? projectStatusMeta.DRAFT;
            return (
              <Link
                key={row.id}
                href={`/account/projects/${row.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-signal/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-base font-semibold text-primary">{row.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      meta.className
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                {(row.objectName || row.companyName) && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {[row.objectName, row.companyName].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.itemCount} позиций</span>
                  <span className="font-medium text-primary">
                    {row.totalTenge > 0 ? formatTenge(row.totalTenge) : "—"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <FormDialog open={open} onOpenChange={setOpen} title="Новый проект">
        <ProjectForm
          onDone={() => setOpen(false)}
          onCreated={(id) => router.push(`/account/projects/${id}`)}
        />
      </FormDialog>
    </div>
  );
}
