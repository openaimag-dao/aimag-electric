import { notFound } from "next/navigation";

import { getMyProject } from "@/server/actions/project-actions";
import { requireUser } from "@/lib/security/rbac";
import { companyAdminRepository } from "@/server/repositories/admin";
import {
  ProjectDetailClient,
  type ProjectDetail,
} from "@/components/account/project-detail-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [project, user] = await Promise.all([getMyProject(id), requireUser()]);
  if (!project) notFound();

  let editable = project.companyId === null;
  if (project.companyId) {
    const memberships = await companyAdminRepository.membershipsForUser(user.id);
    const membership = memberships.find((m) => m.companyId === project.companyId);
    editable = Boolean(membership && membership.role !== "VIEWER");
  }

  const detail: ProjectDetail = {
    id: project.id,
    title: project.title,
    description: project.description,
    objectName: project.objectName,
    region: project.region,
    deadline: project.deadline ? project.deadline.toISOString() : null,
    status: project.status,
    companyName: project.company?.name ?? null,
    ownerName: project.owner.name ?? project.owner.email,
    editable,
    items: project.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      slug: i.slug,
      sku: i.sku,
      title: i.title,
      qty: i.qty,
      unit: i.unit,
      amountTiyn: i.amountTiyn,
      note: i.note,
    })),
  };

  return <ProjectDetailClient project={detail} />;
}
