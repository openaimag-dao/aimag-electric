"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/admin/form-fields";
import { orderDeliveryFormSchema, type OrderDeliveryFormInput } from "@/lib/validations/admin";
import { updateOrderDelivery } from "@/server/actions/admin";

export interface OrderDeliveryFields {
  carrier: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
}

export function OrderDeliveryForm({
  orderId,
  initial,
}: {
  orderId: string;
  initial: OrderDeliveryFields;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<OrderDeliveryFormInput>({
    resolver: zodResolver(orderDeliveryFormSchema),
    defaultValues: {
      carrier: initial.carrier ?? "",
      trackingNumber: initial.trackingNumber ?? "",
      estimatedDelivery: initial.estimatedDelivery ? initial.estimatedDelivery.slice(0, 10) : "",
      actualDelivery: initial.actualDelivery ? initial.actualDelivery.slice(0, 10) : "",
    },
  });

  async function onSubmit(values: OrderDeliveryFormInput) {
    const result = await updateOrderDelivery(orderId, values);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось сохранить доставку");
      return;
    }
    toast.success("Доставка обновлена");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Перевозчик" htmlFor="carrier" hint="без интеграции — вручную">
          <Input id="carrier" {...register("carrier")} />
        </Field>
        <Field label="Трек-номер" htmlFor="trackingNumber">
          <Input id="trackingNumber" {...register("trackingNumber")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ожидаемая дата" htmlFor="estimatedDelivery">
          <Input id="estimatedDelivery" type="date" {...register("estimatedDelivery")} />
        </Field>
        <Field label="Фактическая дата" htmlFor="actualDelivery">
          <Input id="actualDelivery" type="date" {...register("actualDelivery")} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="signal" size="sm" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Сохранить доставку
        </Button>
      </div>
    </form>
  );
}
