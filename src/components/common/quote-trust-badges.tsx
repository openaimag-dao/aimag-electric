import { ShieldCheck, Truck, Building2 } from "lucide-react";

const badges = [
  { icon: ShieldCheck, label: "Бесплатно, заявка ни к чему не обязывает" },
  { icon: Truck, label: "Доставка по всему Казахстану" },
  { icon: Building2, label: "Работаем с юр. лицами и ИП, НДС" },
];

/** Short reassurance row shown above the quote form's submit button — real, already-stated facts (see purchase-panel.tsx and /faq), not new promises. */
export function QuoteTrustBadges() {
  return (
    <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1.5">
      {badges.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="size-3.5 shrink-0 text-signal-700" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
