"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ActionResult } from "@/server/actions/action-result";

interface ConfirmDeleteProps {
  /** Открытие контролируется извне (обычно из row-actions dropdown). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  action: () => Promise<ActionResult>;
  onDeleted?: () => void;
}

/** Reusable destructive confirmation wired to a Server Action. */
export function ConfirmDelete({
  open,
  onOpenChange,
  title = "Удалить запись?",
  description,
  action,
  onDeleted,
}: ConfirmDeleteProps) {
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result.ok) {
      toast.success("Запись удалена");
      onOpenChange(false);
      onDeleted?.();
    } else {
      toast.error(result.error ?? "Не удалось удалить");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={pending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
