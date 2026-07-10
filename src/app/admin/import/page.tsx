import { AdminPageHeader } from "@/components/admin/page-header";
import { ImportClient } from "@/components/admin/import/import-client";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Импорт данных"
        description="Пакетная загрузка из Excel и CSV: категории, производители, товары, цены и остатки. С предпросмотром и журналом ошибок."
      />
      <ImportClient />
    </div>
  );
}
