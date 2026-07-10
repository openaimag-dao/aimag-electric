"use client";

import * as React from "react";
import type { FieldError } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FieldError({ error }: { error?: FieldError }) {
  if (!error) return null;
  return <p className="text-xs text-red-600">{error.message}</p>;
}

export function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: FieldError;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError error={error} />
    </div>
  );
}

/** Native select styled to match the design tokens (form-friendly, uncontrolled). */
export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
NativeSelect.displayName = "NativeSelect";

export { Input, Textarea };
