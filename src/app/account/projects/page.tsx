import type { Metadata } from "next";

import { getMyProjects } from "@/server/actions/project-actions";
import { ProjectsListClient, type ProjectListRow } from "@/components/account/projects-list-client";
import { tiynToTenge } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Проекты",
  robots: { index: false, follow: false },
};

export default async function ProjectsPage() {
  const projects = await getMyProjects();

  const rows: ProjectListRow[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    objectName: p.objectName,
    companyName: p.company?.name ?? null,
    itemCount: p.items.length,
    totalTenge: p.items.reduce(
      (sum, i) => sum + (i.amountTiyn !== null ? tiynToTenge(i.amountTiyn) * i.qty : 0),
      0
    ),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-primary">Проекты</h1>
      <ProjectsListClient rows={rows} />
    </div>
  );
}
