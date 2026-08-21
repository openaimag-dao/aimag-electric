"use client";

import * as React from "react";
import { Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getCategoryAttributeTemplate, setCategoryAttributeTemplate } from "@/server/actions/admin";

interface AttributeRef {
  id: string;
  label: string;
}

/** Presence of an attribute id in the map = included in the template; value = required flag. */
type Template = Record<string, boolean>;

export function CategorySpecTemplatePanel({
  categoryId,
  attributes,
}: {
  categoryId: string;
  attributes: AttributeRef[];
}) {
  const [template, setTemplate] = React.useState<Template>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCategoryAttributeTemplate(categoryId).then((result) => {
      if (cancelled) return;
      const next: Template = {};
      if (result.ok && result.data) {
        for (const item of result.data) next[item.attributeId] = item.required;
      }
      setTemplate(next);
      setDirty(false);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function toggleIncluded(attributeId: string) {
    setTemplate((prev) => {
      const next = { ...prev };
      if (attributeId in next) delete next[attributeId];
      else next[attributeId] = false;
      return next;
    });
    setDirty(true);
  }

  function toggleRequired(attributeId: string) {
    setTemplate((prev) => ({ ...prev, [attributeId]: !prev[attributeId] }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const items = Object.entries(template).map(([attributeId, required]) => ({
      attributeId,
      required,
    }));
    const result = await setCategoryAttributeTemplate(categoryId, items);
    setSaving(false);
    if (result.ok) {
      toast.success("Шаблон характеристик сохранён");
      setDirty(false);
    } else {
      toast.error(result.error ?? "Не удалось сохранить шаблон");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
        <ListChecks className="size-4" />
        Характеристики этой категории
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Отметьте, какие характеристики относятся к товарам этой категории, и какие из них
        обязательны — это влияет на оценку «Качество каталога».
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Загрузка…
        </div>
      ) : attributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Сначала добавьте характеристики в разделе «Характеристики» (/admin/attributes).
        </p>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {attributes.map((a) => {
            const included = a.id in template;
            return (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <label className="flex flex-1 items-center gap-2">
                  <Checkbox checked={included} onCheckedChange={() => toggleIncluded(a.id)} />
                  <span className="text-primary">{a.label}</span>
                </label>
                {included && (
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox
                      checked={template[a.id]}
                      onCheckedChange={() => toggleRequired(a.id)}
                    />
                    обязательно
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!dirty || saving || loading}
          onClick={handleSave}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Сохранить шаблон
        </Button>
      </div>
    </div>
  );
}
