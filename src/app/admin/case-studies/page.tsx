import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CaseStudiesManager,
  type CaseStudyListRow,
} from "@/components/admin/case-studies/case-studies-manager";
import { caseStudyAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage() {
  const rows = await caseStudyAdminRepository.list();
  const data: CaseStudyListRow[] = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    scope: p.scope,
    description: p.description,
    location: p.location,
    year: p.year,
    metric: p.metric,
    metricLabel: p.metricLabel,
    category: p.category,
    order: p.order,
    published: p.published,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Проекты"
        description="Реализованные проекты для /projects и блока «Поставки на объекты» на главной."
      />
      <CaseStudiesManager rows={data} />
    </div>
  );
}
