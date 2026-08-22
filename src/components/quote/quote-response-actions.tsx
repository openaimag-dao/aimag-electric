"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToQuote } from "@/server/actions/quote-response-actions";

export function QuoteResponseActions({ token }: { token: string }) {
  const [decision, setDecision] = React.useState<"approve" | "reject" | null>(null);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<"approve" | "reject" | null>(null);

  async function handleSubmit() {
    if (!decision) return;
    setSubmitting(true);
    const result = await respondToQuote(token, decision, note);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось отправить ответ");
      return;
    }
    setDone(decision);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
        {done === "approve" ? (
          <CheckCircle2 className="size-10 text-emerald-600" />
        ) : (
          <XCircle className="size-10 text-red-500" />
        )}
        <p className="font-display text-lg font-semibold text-primary">
          {done === "approve" ? "КП одобрено" : "КП отклонено"}
        </p>
        <p className="text-sm text-muted-foreground">
          Менеджер AIMAG ELECTRIC уведомлён и свяжется с вами.
        </p>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="signal"
          size="lg"
          className="flex-1"
          onClick={() => setDecision("approve")}
        >
          <ThumbsUp className="size-4" /> Одобрить КП
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 text-red-600 hover:bg-red-50"
          onClick={() => setDecision("reject")}
        >
          <ThumbsDown className="size-4" /> Отклонить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-primary">
        {decision === "approve" ? "Подтвердите одобрение" : "Укажите причину (необязательно)"}
      </p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          decision === "approve" ? "Комментарий (необязательно)" : "Что не устроило в предложении?"
        }
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setDecision(null)}
          disabled={submitting}
        >
          Назад
        </Button>
        <Button
          variant={decision === "approve" ? "signal" : "outline"}
          className={decision === "reject" ? "flex-1 text-red-600 hover:bg-red-50" : "flex-1"}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {decision === "approve" ? "Подтвердить одобрение" : "Подтвердить отклонение"}
        </Button>
      </div>
    </div>
  );
}
