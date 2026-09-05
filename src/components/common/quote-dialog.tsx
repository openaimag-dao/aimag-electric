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
import { track } from "@/lib/analytics";
import type { CartItem } from "@/types/cart";

interface QuoteDialogProps {
  children?: React.ReactNode;
  triggerLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Pre-fill the КП with specific product lines (e.g. the product page you're on). */
  items?: CartItem[];
  /** Pre-fill the project/object name, editable when submitting a full cart. */
  defaultTitle?: string;
  /** Pre-fill the free-text message, e.g. a search query that had no catalog match. */
  defaultMessage?: string;
  /** Where this dialog was opened from — tagged on the quote_dialog_open analytics event. */
  analyticsSource?: string;
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
  defaultTitle,
  defaultMessage,
  analyticsSource = "unknown",
}: QuoteDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) track("quote_dialog_open", { source: analyticsSource });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Получить коммерческое предложение</DialogTitle>
          <DialogDescription>
            Оставьте данные — инженер подберёт продукцию и пришлёт КП с ценами и сроками поставки.
          </DialogDescription>
        </DialogHeader>
        <QuoteForm items={items} defaultTitle={defaultTitle} defaultMessage={defaultMessage} />
      </DialogContent>
    </Dialog>
  );
}
