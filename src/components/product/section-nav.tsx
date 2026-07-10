"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SectionNavProps {
  sections: { id: string; label: string }[];
}

/** Sticky in-page tabs that scroll to and highlight the active section. */
export function SectionNav({ sections }: SectionNavProps) {
  const [active, setActive] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="sticky top-16 z-20 -mx-4 border-b border-border bg-background/90 px-4 backdrop-blur md:top-16">
      <div className="flex gap-1 overflow-x-auto py-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === s.id
                ? "bg-primary text-primary-foreground"
                : "text-steel-600 hover:bg-secondary hover:text-primary"
            )}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
