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
import { QuoteForm } from "@/components/common/quote-form";
import type { CartItem } from "@/types/cart";

interface QuoteDialogProps {
  children?: React.ReactNode;
  triggerLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Pre-fill the КП with specific product lines (e.g. the product page you're on). */
  items?: CartItem[];
}

/**
 * Reusable "Получить КП" entry point. Pass custom `children` as the trigger,
 * or rely on the default styled button.
 */
export function QuoteDialog({
  children,
  triggerLabel = "Получить КП",
  variant = "signal",
  size = "default",
  className,
  items,
}: QuoteDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant={variant} size={size} className={className}>
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Получить коммерческое предложение</DialogTitle>
          <DialogDescription>
            Оставьте данные — инженер подберёт продукцию и пришлёт КП с ценами и сроками поставки.
          </DialogDescription>
        </DialogHeader>
        <QuoteForm items={items} />
      </DialogContent>
    </Dialog>
  );
}
