import { QuoteDialog } from "@/components/common/quote-dialog";
import { RatingStars } from "@/components/product/rating-stars";
import type { ProductReview } from "@/types/product-detail";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Reviews({ reviews }: { reviews: ProductReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Отзывов пока нет. Станьте первым, кто оценит эту позицию.
        </p>
      </div>
    );
  }

  const avg =
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
        <div className="text-center">
          <div className="font-display text-4xl font-bold text-primary">{avg}</div>
          <RatingStars rating={avg} className="mt-1" />
        </div>
        <div className="text-sm text-muted-foreground">
          На основе {reviews.length}{" "}
          {reviews.length === 1 ? "отзыва" : "отзывов"} от заказчиков
        </div>
        <div className="ml-auto">
          <QuoteDialog variant="outline" triggerLabel="Оставить запрос" />
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {reviews.map((review, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-steel-950 text-sm font-semibold text-signal">
                {initials(review.author)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {review.author}
                    </p>
                    {review.company && (
                      <p className="text-xs text-muted-foreground">{review.company}</p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground" dateTime={review.date}>
                    {formatDate(review.date)}
                  </time>
                </div>
                <RatingStars rating={review.rating} size={14} className="mt-2" />
                <p className="mt-2.5 text-sm leading-relaxed text-steel-700">
                  {review.text}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
