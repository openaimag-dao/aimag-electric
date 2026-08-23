"use client";

import * as React from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToQuote } from "@/server/actions/quote-response-actions";

type Decision = "approve" | "reject" | "changes";

const STEP_COPY: Record<Decision, { prompt: string; placeholder: string; confirm: string }> = {
  approve: {
    prompt: "Подтвердите одобрение",
    placeholder: "Комментарий (необязательно)",
    confirm: "Подтвердить одобрение",
  },
  reject: {
    prompt: "Укажите причину (необязательно)",
    placeholder: "Что не устроило в предложении?",
    confirm: "Подтвердить отклонение",
  },
  changes: {
    prompt: "Что нужно изменить?",
    placeholder: "Цена, количество, сроки поставки, замена позиции…",
    confirm: "Отправить запрос",
  },
};

const DONE_COPY: Record<Decision, { title: string; body: string }> = {
  approve: {
    title: "КП одобрено",
    body: "Менеджер AIMAG ELECTRIC уведомлён и свяжется с вами.",
  },
  reject: {
    title: "КП отклонено",
    body: "Менеджер AIMAG ELECTRIC уведомлён и свяжется с вами.",
  },
  changes: {
    title: "Запрос отправлен",
    body: "Менеджер подготовит обновлённое КП с учётом ваших пожеланий и пришлёт новую ссылку.",
  },
};

export function QuoteResponseActions({ token }: { token: string }) {
  const [decision, setDecision] = React.useState<Decision | null>(null);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<Decision | null>(null);

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
        ) : done === "changes" ? (
          <MessageSquareText className="size-10 text-amber-600" />
        ) : (
          <XCircle className="size-10 text-red-500" />
        )}
        <p className="font-display text-lg font-semibold text-primary">{DONE_COPY[done].title}</p>
        <p className="text-sm text-muted-foreground">{DONE_COPY[done].body}</p>
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
          className="flex-1"
          onClick={() => setDecision("changes")}
        >
          <MessageSquareText className="size-4" /> Запросить изменения
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
      <p className="text-sm font-medium text-primary">{STEP_COPY[decision].prompt}</p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={STEP_COPY[decision].placeholder}
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
          {STEP_COPY[decision].confirm}
        </Button>
      </div>
    </div>
  );
}
