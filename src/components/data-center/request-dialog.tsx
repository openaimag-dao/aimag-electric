"use client";

import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataCenterRequestForm } from "@/components/data-center/request-form";
import { track } from "@/lib/analytics";

interface DataCenterRequestDialogProps {
  children?: React.ReactNode;
  triggerLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  defaultCategory?: string;
  defaultComment?: string;
}

/** "Получить КП" / "Отправить спецификацию" / "Запросить оптовые цены" entry point for the /data-center B2B form — same dialog, different trigger copy and defaults. */
export function DataCenterRequestDialog({
  children,
  triggerLabel = "Получить коммерческое предложение",
  variant = "signal",
  size = "default",
  className,
  defaultCategory,
  defaultComment,
}: DataCenterRequestDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) track("data_center_quote_dialog_open");
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button variant={variant} size={size} className={className}>
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Заявка на оборудование для дата-центра</DialogTitle>
          <DialogDescription>
            Укажите категории и, при необходимости, перечень позиций или спецификацию — инженер
            подготовит коммерческое предложение.
          </DialogDescription>
        </DialogHeader>
        <DataCenterRequestForm
          defaultCategory={defaultCategory}
          defaultComment={defaultComment}
          onSuccess={() => setOpen(true)}
        />
      </DialogContent>
    </Dialog>
  );
}
