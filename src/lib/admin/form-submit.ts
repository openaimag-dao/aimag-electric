import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import type { ActionResult } from "@/server/actions/action-result";

/**
 * Applies a Server Action result to a react-hook-form: on success shows a
 * toast and runs onDone; on failure maps field errors back onto the form and
 * shows an error toast. Centralizes the boilerplate every admin form repeated.
 */
export function handleFormResult<T extends FieldValues>(
  result: ActionResult,
  {
    setError,
    onDone,
    successMessage,
  }: {
    setError: UseFormSetError<T>;
    onDone: () => void;
    successMessage: string;
  }
): boolean {
  if (result.ok) {
    toast.success(successMessage);
    onDone();
    return true;
  }
  if (result.fieldErrors) {
    for (const [key, message] of Object.entries(result.fieldErrors)) {
      setError(key as Path<T>, { message });
    }
  }
  toast.error(result.error ?? "Ошибка");
  return false;
}
