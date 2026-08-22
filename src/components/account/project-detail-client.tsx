"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ProjectForm, type ProjectFields } from "@/components/account/project-form";
import { ProjectStatusSelect } from "@/components/account/project-status-select";
import { ProjectItemsPanel, type ProjectItemRow } from "@/components/account/project-items-panel";
import { QuoteForm } from "@/components/common/quote-form";
import { deleteProject } from "@/server/actions/project-actions";
import { tiynToTenge } from "@/lib/money";
import type { CartItem } from "@/types/cart";

export interface ProjectDetail extends ProjectFields {
  status: string;
  companyName: string | null;
  ownerName: string;
  items: ProjectItemRow[];
  editable: boolean;
}

export function ProjectDetailClient({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const quoteItems: CartItem[] = project.items
    .filter((i) => i.productId)
    .map((i) => ({
      productId: i.productId!,
      slug: i.slug ?? "",
      sku: i.sku ?? "",
      title: i.title,
      unit: i.unit,
      priceTenge: i.amountTiyn !== null ? tiynToTenge(i.amountTiyn) : null,
      qty: i.qty,
    }));

  return (
    <div className="space-y-6">
      <Link
        href="/account/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К списку проектов
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-primary">{project.title}</h1>
              <ProjectStatusSelect
                projectId={project.id}
                status={project.status}
                editable={project.editable}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {project.objectName && <span>Объект: {project.objectName}</span>}
              {project.region && <span>Регион: {project.region}</span>}
              {project.companyName && <span>Компания: {project.companyName}</span>}
              {project.deadline && (
                <span>Срок: {new Date(project.deadline).toLocaleDateString("ru-RU")}</span>
              )}
            </div>
          </div>
          {project.editable && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Изменить
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>
        {project.description && (
          <p className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-primary">
            {project.description}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-primary">Спецификация</h2>
          <ProjectItemsPanel
            projectId={project.id}
            items={project.items}
            editable={project.editable}
          />
        </div>

        {quoteItems.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-lg font-semibold text-primary">Запросить КП</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Инженер проверит наличие и пришлёт коммерческое предложение по всем позициям проекта.
            </p>
            <div className="mt-4">
              <QuoteForm items={quoteItems} defaultTitle={project.title} />
            </div>
          </div>
        )}
      </div>

      <FormDialog open={editOpen} onOpenChange={setEditOpen} title="Изменить проект">
        <ProjectForm initial={project} onDone={() => setEditOpen(false)} />
      </FormDialog>

      <ConfirmDelete
        open={deleting}
        onOpenChange={setDeleting}
        description={`Проект «${project.title}» и все его позиции будут удалены.`}
        action={() => deleteProject(project.id)}
        onDeleted={() => router.push("/account/projects")}
      />
    </div>
  );
}
