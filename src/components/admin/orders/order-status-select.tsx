"use client";

import * as React from "react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/admin/form-fields";
import { orderStatusMeta, orderStatusOrder } from "@/config/order-meta";
import { setOrderStatus } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [current, setCurrent] = React.useState(status);
  const [saving, setSaving] = React.useState(false);
  const meta = orderStatusMeta[current] ?? orderStatusMeta.NEW;

  async function handleChange(next: string) {
    const prev = current;
    setCurrent(next);
    setSaving(true);
    const result = await setOrderStatus(orderId, next);
    setSaving(false);
    if (!result.ok) {
      setCurrent(prev);
      toast.error(result.error ?? "Не удалось изменить статус");
    }
  }

  return (
    <NativeSelect
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className={cn("h-9 w-auto text-sm font-medium", meta.className)}
    >
      {orderStatusOrder.map((s) => (
        <option key={s} value={s}>
          {orderStatusMeta[s].label}
        </option>
      ))}
    </NativeSelect>
  );
}
