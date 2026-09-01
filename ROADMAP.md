# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                                                                                                                                                                                                                                                                                                            |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                                                                                                                                                                                                                                                                                                     |
| 4   | Engineering Intelligence       | **Partial**                 | SKU/title/manufacturer matching plus structured checks: cable dimension (cores×cross-section, from title text) and voltage (from an optional file column) mismatches against the matched product's real attrs are now flagged explicitly. Current/amperage diffing is not built and won't be — no product in the catalog carries a current attribute at all, so there is no real data to diff against; adding one would mean inventing a spec, not matching one. General "differs on X" for non-cable categories with no `NxM` title notation still needs more source signal. |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, and `CompanyPrice` now applied consistently across every cart/quote entry point, including the main `/catalog` grid — added this cycle.                                                                                                                                                                                                                                                                                                 |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                                                                                                                                                                                                                          |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** Phase 4's voltage/current
diffing, the deferred half of last cycle's dimension-diffing slice.
`parse-sheet.ts`'s column mapping is generic — any `ColumnSpec` added to
`SPEC_IMPORT_COLUMNS` is picked up with zero parser changes — so this
was smaller than it first looked once traced.

**Voltage: shipped, real data on both sides.** `product.voltage` (кВ) is
already a first-class structured attribute on every product
(`CatalogProductDTO.voltage`), so adding an optional "Напряжение" column
to the upload schema gives the matcher a second real value to diff
against it — same honest pattern as last cycle's dimension check: only
fires when both the file and the matched product have a real value.

**Current: investigated and explicitly not built.** Checked whether any
product carries a current/amperage attribute anywhere in the real
catalog data (`catalog-data.ts`'s `ATTRIBUTE_DEFS`, the DB `Attribute`
seed) — none exists; only `material`, `cores`, `crossSection`, `voltage`
are defined. Adding a "Ток" file column to diff against would have
nothing real on the catalog side to compare it to, i.e. it would either
silently do nothing or require inventing a spec value — both wrong.
Correctly not built; would need a real `Attribute` + seeded values on
products first, which is a data-modeling decision for AIMAG, not a code
change.

**Fix shipped:**

- `spec-import-columns.ts`: new optional `voltage` column (aliases
  "напряжение", "u", "uном", etc.).
- `spec-import-actions.ts`: parses the column's raw cell text into a
  number (tolerant of a trailing unit like "10 кВ"), `null` when absent
  or unparseable — never defaults to a guessed value.
- `spec-match-service.ts`: `SpecFileRow` carries `voltage: number | null`
  through to the matcher.
- `spec-import/matcher.ts`: `SpecRowInput`/`MatchableProduct` gained
  `voltage`; `scoreCandidate` now collects both the dimension warning and
  a voltage warning into a list and joins them into `technicalWarning` —
  a product can now surface either, both, or neither, all in the one
  field the wizard already renders.
- `spec-import-wizard.tsx`: upload-screen hint text now mentions the
  optional column.
- `matcher.test.ts`: three new cases (voltage mismatch flagged, silent
  with no file value, both warnings combine).

Verified: typecheck clean, lint has only the same pre-existing warnings,
48/48 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: dimension diffing still only covers categories whose titles embed `NxM` notation (cable/wire/splice) — fittings/insulators/breakers have no such signal and would need a different source (likely a file column, same as voltage). Current/amperage diffing needs a real `Attribute` + seeded values first (see above) — a data decision, not scoped as engineering work.
- Phase 9: no lead-assignment automation.
- Phase 7 (smaller): `addProjectItem`/`saveCartAsProject` (the Project/BOM flow, separate from the cart) still trust whatever `priceTenge` the client sends verbatim, with no server-side re-check against catalog or company price — pre-existing, not introduced this cycle, but worth hardening later. Not fixed now because a naive fix would also break legitimate freeform (no-`productId`) BOM lines, which have no catalog price to re-resolve against.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 4's structured comparison is now reasonably complete for the data
that actually exists (dimensions + voltage). The next real gap is
smaller-scoped: Phase 7's `addProjectItem`/`saveCartAsProject`
price-trust issue (see Known issues above) — worth a focused look at
whether a narrow fix (re-check only rows that carry a real `productId`,
leave freeform BOM lines alone) is honestly buildable in one cycle before
picking a bigger phase.
