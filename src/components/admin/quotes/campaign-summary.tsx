import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CampaignRow {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  hasOrder: boolean;
}

export function CampaignSummary({ rows }: { rows: CampaignRow[] }) {
  const groups = new Map<string, CampaignRow & { requests: number; orders: number }>();
  for (const row of rows) {
    const key = JSON.stringify([row.utmSource, row.utmMedium, row.utmCampaign]);
    const group = groups.get(key) ?? { ...row, requests: 0, orders: 0 };
    group.requests++;
    if (row.hasOrder) group.orders++;
    groups.set(key, group);
  }
  const summary = [...groups.entries()].sort((a, b) => b[1].requests - a[1].requests).slice(0, 10);
  return (
    <details className="rounded-xl border border-border bg-card p-5">
      <summary className="cursor-pointer font-display text-lg font-semibold text-primary">
        Заявки по рекламным меткам
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">
        Топ-10 за всё время. Учитывается последний переход клиента с UTM в его вкладке за 24 часа.
        «Без UTM» включает старые заявки и переходы без меток. Заказы — созданные в CRM, не
        подтверждённая оплата.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Источник</TableHead>
            <TableHead>Канал</TableHead>
            <TableHead>Кампания</TableHead>
            <TableHead className="text-right">Заявки</TableHead>
            <TableHead className="text-right">Заказы</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.map(([key, group]) => (
            <TableRow key={key}>
              <TableCell className="max-w-48 break-words">
                {group.utmSource ||
                  (group.utmMedium || group.utmCampaign ? "Не указан" : "Без UTM")}
              </TableCell>
              <TableCell className="max-w-48 break-words">{group.utmMedium || "—"}</TableCell>
              <TableCell className="max-w-48 break-words">{group.utmCampaign || "—"}</TableCell>
              <TableCell className="text-right">{group.requests}</TableCell>
              <TableCell className="text-right">{group.orders}</TableCell>
            </TableRow>
          ))}
          {!summary.length && (
            <TableRow>
              <TableCell colSpan={5}>Заявок пока нет.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </details>
  );
}
