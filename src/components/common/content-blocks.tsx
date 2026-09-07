import type { ArticleBlock } from "@/config/articles";

/** Renders a block of long-form SEO/editorial content — shared by blog articles, category landing copy, and standalone SEO pages. */
export function ContentBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case "h2":
      return <h2 className="mt-8 font-display text-xl font-semibold text-primary">{block.text}</h2>;
    case "p":
      return <p className="mt-4 leading-relaxed text-foreground">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-foreground">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-secondary/60">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-medium text-primary">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "note":
      return (
        <p className="mt-4 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );
  }
}
