"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, NativeSelect } from "@/components/admin/form-fields";
import { dealFormSchema, type DealFormInput } from "@/lib/validations/crm";
import { createDeal, updateDeal } from "@/server/actions/admin";
import { handleFormResult } from "@/lib/admin/form-submit";
import { dealStageMeta, dealStageOrder } from "@/config/crm-meta";

export interface DealRow {
  id: string;
  title: string;
  customerId: string;
  stage: string;
  amountTenge: number | "";
  probability: number;
  expectedAt: string;
  ownerId: string | null;
  lostReason: string | null;
}

interface Ref {
  id: string;
  label: string;
}

export function DealForm({
  initial,
  customers,
  managers,
  defaultCustomerId,
  onDone,
}: {
  initial?: DealRow;
  customers: Ref[];
  managers: Ref[];
  defaultCustomerId?: string;
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DealFormInput>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      customerId: initial?.customerId ?? defaultCustomerId ?? "",
      stage: (initial?.stage as DealFormInput["stage"]) ?? "NEW",
      amountTenge: initial?.amountTenge ?? "",
      probability: initial?.probability ?? 0,
      expectedAt: initial?.expectedAt ?? "",
      ownerId: initial?.ownerId ?? "",
      lostReason: initial?.lostReason ?? "",
    },
  });

  const stage = watch("stage");

  async function onSubmit(values: DealFormInput) {
    const result = isEdit ? await updateDeal(initial!.id, values) : await createDeal(values);
    handleFormResult<DealFormInput>(result, {
      setError,
      onDone,
      successMessage: isEdit ? "Сделка обновлена" : "Сделка создана",
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => toast.error("Заполните обязательные поля"))}
      className="grid gap-4"
    >
      <Field label="Название сделки" htmlFor="title" error={errors.title}>
        <Input id="title" {...register("title")} />
      </Field>
      <Field label="Клиент *" htmlFor="customerId" error={errors.customerId}>
        <NativeSelect
          id="customerId"
          {...register("customerId")}
          disabled={Boolean(defaultCustomerId)}
        >
          <option value="">— выберите —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Стадия" htmlFor="stage" error={errors.stage}>
          <NativeSelect id="stage" {...register("stage")}>
            {dealStageOrder.map((s) => (
              <option key={s} value={s}>
                {dealStageMeta[s].label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Сумма, ₸" htmlFor="amountTenge" error={errors.amountTenge}>
          <Input id="amountTenge" type="number" step="0.01" {...register("amountTenge")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Вероятность, %" htmlFor="probability" error={errors.probability}>
          <Input id="probability" type="number" min={0} max={100} {...register("probability")} />
        </Field>
        <Field label="Ожидаемое закрытие" htmlFor="expectedAt" error={errors.expectedAt}>
          <Input id="expectedAt" type="date" {...register("expectedAt")} />
        </Field>
      </div>
      <Field label="Ответственный" htmlFor="ownerId" error={errors.ownerId}>
        <NativeSelect id="ownerId" {...register("ownerId")}>
          <option value="">— не назначен —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {stage === "LOST" && (
        <Field label="Причина проигрыша" htmlFor="lostReason" error={errors.lostReason}>
          <Textarea id="lostReason" rows={2} {...register("lostReason")} />
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" variant="signal" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
