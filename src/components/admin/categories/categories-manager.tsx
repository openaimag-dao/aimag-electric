"use client";

import { ImageOff } from "lucide-react";

import { useCrudManager } from "@/hooks/use-crud-manager";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { CategoryForm, type CategoryRow } from "@/components/admin/categories/category-form";
import { deleteCategory } from "@/server/actions/admin";

export interface CategoryListRow extends CategoryRow {
  productCount: number;
}

interface AttributeRef {
  id: string;
  label: string;
}

export function CategoriesManager({
  rows,
  attributes,
}: {
  rows: CategoryListRow[];
  attributes: AttributeRef[];
}) {
  const {
    query,
    setQuery,
    filtered,
    formOpen,
    setFormOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    deleting,
    setDeleting,
    closeDelete,
  } = useCrudManager<CategoryListRow, CategoryRow>(rows, (r) => `${r.title} ${r.slug}`);

  return (
    <div className="space-y-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onAdd={openCreate}
        addLabel="Добавить категорию"
        placeholder="Поиск по названию или slug…"
        count={rows.length}
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Метка</TableHead>
              <TableHead className="text-center">Товаров</TableHead>
              <TableHead className="text-center">Порядок</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, admin thumbnail only
                    <img
                      src={row.image}
                      alt=""
                      className="size-10 rounded-md border border-border object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                      <ImageOff className="size-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-primary">{row.title}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.slug}
                </TableCell>
                <TableCell>
                  {row.spec ? (
                    <Badge variant="muted">{row.spec}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{row.productCount}</TableCell>
                <TableCell className="text-center text-muted-foreground">{row.order}</TableCell>
                <TableCell>
                  <RowActions onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать категорию" : "Новая категория"}
      >
        <CategoryForm initial={editing} attributes={attributes} onDone={closeForm} />
      </FormDialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={closeDelete}
        description={
          deleting
            ? `Категория «${deleting.title}» будет удалена без возможности восстановления.`
            : ""
        }
        action={() => deleteCategory(deleting!.id)}
      />
    </div>
  );
}
