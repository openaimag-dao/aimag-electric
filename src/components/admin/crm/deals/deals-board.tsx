"use client";

import * as React from "react";
import { Plus, GripVertical, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/admin/form-dialog";
import { formatTenge } from "@/lib/money";
import { cn } from "@/lib/utils";
import { dealStageMeta, dealStageOrder } from "@/config/crm-meta";
import { DealForm, type DealRow } from "@/components/admin/crm/deals/deal-form";
import { setDealStage } from "@/server/actions/admin";

export interface DealCard {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  stage: string;
  amountTenge: number | null;
  probability: number;
  ownerName: string | null;
  expectedAt: string | null;
  lostReason: string | null;
}

interface Ref {
  id: string;
  label: string;
}

export function DealsBoard({
  deals: initialDeals,
  customers,
  managers,
}: {
  deals: DealCard[];
  customers: Ref[];
  managers: Ref[];
}) {
  const [deals, setDeals] = React.useState(initialDeals);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DealRow | undefined>();

  React.useEffect(() => setDeals(initialDeals), [initialDeals]);

  const byStage = React.useMemo(() => {
    const map: Record<string, DealCard[]> = {};
    for (const s of dealStageOrder) map[s] = [];
    for (const d of deals) (map[d.stage] ??= []).push(d);
    return map;
  }, [deals]);

  async function moveTo(id: string, stage: string) {
    const current = deals.find((d) => d.id === id);
    if (!current || current.stage === stage) return;
    // Optimistic update
    const prev = deals;
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stage } : d)));
    const result = await setDealStage(id, stage);
    if (!result.ok) {
      setDeals(prev);
      toast.error(result.error ?? "Не удалось переместить сделку");
    } else {
      toast.success(`Перемещено: ${dealStageMeta[stage].label}`);
    }
  }

  function toEditRow(d: DealCard): DealRow {
    return {
      id: d.id,
      title: d.title,
      customerId: d.customerId,
      stage: d.stage,
      amountTenge: d.amountTenge ?? "",
      probability: d.probability,
      expectedAt: d.expectedAt ? d.expectedAt.slice(0, 10) : "",
      ownerId: null,
      lostReason: d.lostReason,
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="signal"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Новая сделка
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {dealStageOrder.map((stage) => {
          const cards = byStage[stage] ?? [];
          const total = cards.reduce((s, c) => s + (c.amountTenge ?? 0), 0);
          const meta = dealStageMeta[stage];
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
                if (dragId) moveTo(dragId, stage);
                setDragId(null);
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-secondary/30 transition-colors",
                overStage === stage ? "border-signal bg-signal/5" : "border-border"
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", meta.className)}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{cards.length}</span>
                </div>
                {total > 0 && (
                  <span className="font-mono text-xs text-muted-foreground">{formatTenge(total)}</span>
                )}
              </div>

              <div className="flex flex-col gap-2 p-2">
                {cards.map((d) => (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => {
                      setEditing(toEditRow(d));
                      setFormOpen(true);
                    }}
                    className={cn(
                      "group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-signal/50 hover:shadow-md",
                      dragId === d.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-steel-300 group-hover:text-steel-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{d.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Building2 className="size-3" /> {d.customerName}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {d.amountTenge !== null ? formatTenge(d.amountTenge) : "—"}
                          </span>
                          {d.probability > 0 && (
                            <span className="text-xs text-muted-foreground">{d.probability}%</span>
                          )}
                        </div>
                        {d.ownerName && (
                          <p className="mt-1 truncate text-xs text-steel-500">{d.ownerName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    Перетащите сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Редактировать сделку" : "Новая сделка"}
      >
        <DealForm
          initial={editing}
          customers={customers}
          managers={managers}
          onDone={() => setFormOpen(false)}
        />
      </FormDialog>
    </div>
  );
}
