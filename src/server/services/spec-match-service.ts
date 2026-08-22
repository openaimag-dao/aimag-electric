import "server-only";

import { catalogService } from "@/server/services/catalog-service";
import { matchRow, type RowMatchResult } from "@/lib/spec-import/matcher";
import type { CatalogProductDTO } from "@/server/dto";

export interface SpecFileRow {
  row: number;
  sku: string;
  title: string;
  qty: number;
  unit: string;
  manufacturer: string;
}

export interface MatchedSpecRow extends SpecFileRow {
  result: RowMatchResult<CatalogProductDTO>;
}

const CANDIDATE_POOL = 6;

/**
 * Matches each parsed spec row against real, published catalog products —
 * candidates come from the same search used by the header autocomplete
 * (catalogService.searchSuggestions), never a second index. Runs rows
 * sequentially: spec files are small (capped upstream) and this keeps
 * concurrent DB load predictable.
 */
export async function matchSpecRows(rows: SpecFileRow[]): Promise<MatchedSpecRow[]> {
  const out: MatchedSpecRow[] = [];
  for (const row of rows) {
    const query = row.sku || row.title;
    const candidates = query ? await catalogService.searchSuggestions(query, CANDIDATE_POOL) : [];
    const result = matchRow(
      { sku: row.sku, title: row.title, manufacturer: row.manufacturer },
      candidates
    );
    out.push({ ...row, result });
  }
  return out;
}
