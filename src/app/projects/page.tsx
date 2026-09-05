import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { caseStudyService } from "@/server/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Проекты — AIMAG ELECTRIC",
  description:
    "Реализованные поставки в энергетике, транспорте и промышленности по всему Казахстану.",
};

export default async function ProjectsPage() {
  const caseStudies = await caseStudyService.list();

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
        Проекты
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Комплектуем крупные проекты в энергетике, транспорте и промышленности — с соблюдением сроков
        и документов.
      </p>

      {caseStudies.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Кейсы готовятся к публикации — загляните позже.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {caseStudies.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-signal/50"
            >
              <div className="relative flex h-40 flex-col justify-end overflow-hidden border-b border-border bg-steel-950 p-6">
                <div className="conductor-grid absolute inset-0 opacity-40" aria-hidden />
                <div
                  className="absolute -right-10 -top-10 size-40 rounded-full bg-signal/15 blur-2xl"
                  aria-hidden
                />
                <div className="relative">
                  <div className="font-display text-4xl font-bold text-signal">
                    {project.metric}
                  </div>
                  <div className="text-sm text-steel-400">{project.metricLabel}</div>
                </div>
                <Badge variant="signal" className="absolute right-4 top-4">
                  {project.category}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-display text-lg font-semibold text-primary">{project.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {project.scope}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-signal-700" />
                    {project.location}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    {project.year}
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
