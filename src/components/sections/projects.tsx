import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/config/projects";

/** Realized projects — proof of scale for large-project buyers. */
export function Projects() {
  return (
    <section className="border-b border-steel-800 bg-steel-950 py-20 text-white md:py-24">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Проекты"
            title="Поставки на объекты по всей стране"
            description="Комплектуем крупные проекты в энергетике, транспорте и промышленности — с соблюдением сроков и документов."
            className="[&_h2]:text-white [&_p]:text-steel-300 [&_span]:text-signal"
          />
          <Button
            asChild
            variant="outline"
            className="border-steel-600 bg-transparent text-white hover:bg-steel-800 hover:text-white"
          >
            <Link href="/projects">
              Все проекты
              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-steel-800 bg-steel-900/50 transition-colors hover:border-signal/50"
            >
              <div className="relative flex h-40 flex-col justify-end overflow-hidden border-b border-steel-800 p-6">
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
                <h3 className="font-display text-lg font-semibold text-white">{project.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-400">
                  {project.scope}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs text-steel-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-signal" />
                    {project.location}
                  </span>
                  <span className="font-mono">{project.year}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
