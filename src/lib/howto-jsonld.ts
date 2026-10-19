/** Builds HowTo JSON-LD from a plain ordered step list — for tool/guide pages that walk through a procedure. */
export function buildHowToJsonLd(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map(({ name, text }, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name,
      text,
    })),
  };
}
