import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { caseStudyService } from "@/server/services";
import { StaticPage } from "@/components/static/static-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await caseStudyService.getBySlug(slug);
  if (!project) return { title: "Проект не найден" };

  const url = `${siteConfig.url}/projects/${project.slug}`;
  return {
    title: `${project.title} — Проекты AIMAG ELECTRIC`,
    description: project.scope,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: project.title, description: project.scope },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await caseStudyService.getBySlug(slug);
  if (!project) notFound();

  return (
    <StaticPage
      title={project.title}
      subtitle={`${project.category} · ${project.location} · ${project.year}`}
    >
      <p className="text-lg font-medium text-primary">{project.scope}</p>
      <div className="flex items-baseline gap-2 rounded-lg border border-border bg-secondary/40 p-4">
        <span className="font-display text-3xl font-bold text-signal-700">{project.metric}</span>
        <span className="text-sm text-muted-foreground">{project.metricLabel}</span>
      </div>
      {project.description?.split("\n\n").map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </StaticPage>
  );
}
