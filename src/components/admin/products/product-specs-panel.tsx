"use client";

import * as React from "react";
import { Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Input, NativeSelect } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import {
  getProductSpecFields,
  saveProductSpecs,
  type ProductSpecField,
} from "@/server/actions/admin";

export function ProductSpecsPanel({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId: string;
}) {
  const [fields, setFields] = React.useState<ProductSpecField[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductSpecFields(productId).then((result) => {
      if (cancelled) return;
      setFields(result.ok ? (result.data ?? []) : []);
      setDirty(false);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // categoryId isn't read directly — refetching when it changes keeps the
    // template in sync if the user switches category before saving the form.
  }, [productId, categoryId]);

  function setValue(attributeId: string, value: string) {
    setFields((prev) => prev.map((f) => (f.attributeId === attributeId ? { ...f, value } : f)));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveProductSpecs(
      productId,
      fields.map((f) => ({
        attributeId: f.attributeId,
        type: f.type,
        value: f.value,
        valueId: f.valueId,
      }))
    );
    setSaving(false);
    if (result.ok) {
      toast.success("Характеристики сохранены");
      setDirty(false);
    } else {
      toast.error(result.error ?? "Не удалось сохранить характеристики");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
        <ListChecks className="size-4" />
        Характеристики
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Загрузка…
        </div>
      ) : fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Для категории этого товара не настроен шаблон характеристик — добавьте его в «Категории».
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.attributeId}>
              <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                {f.name}
                {f.unit ? `, ${f.unit}` : ""}
                {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === "BOOLEAN" ? (
                <NativeSelect
                  value={f.value}
                  onChange={(e) => setValue(f.attributeId, e.target.value)}
                >
                  <option value="">— не указано —</option>
                  <option value="да">Да</option>
                  <option value="нет">Нет</option>
                </NativeSelect>
              ) : (
                <Input value={f.value} onChange={(e) => setValue(f.attributeId, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dirty || saving || loading}
            onClick={handleSave}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Сохранить характеристики
          </Button>
        </div>
      )}
    </div>
  );
}
