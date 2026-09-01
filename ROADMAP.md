# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                                                                                                                  |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                                                                                                            |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                                                                                                     |
| 4   | Engineering Intelligence       | **Partial**                 | SKU/title/manufacturer matching plus a first structured check — cable dimension (cores×cross-section) mismatches between a spec file's title text and the matched product's real attrs are now flagged explicitly, added this cycle. Voltage/current diffing and general "differs on X" for non-cable categories still need the sheet parser extended with technical columns. |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                                                                                                         |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                                                                                                      |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, and `CompanyPrice` now applied consistently across every cart/quote entry point, including the main `/catalog` grid — added this cycle.                                                                                                 |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                                                                      |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                                                                  |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                            |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                          |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                            |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** Phase 4's structured
technical-parameter comparison. The stated plan was to scope the sheet
parser extension first (`spec-match-service.ts`'s `SpecFileRow` has no
technical fields, only sku/title/qty/unit/manufacturer), since that
seemed like the necessary first step before any diffing could exist.
Investigated before building, since "extend the parser" looked like the
obvious first slice but is also the biggest, riskiest piece (open-ended
column-mapping with no fixed schema).

**Investigation found a smaller, real slice that doesn't touch the
parser at all.** The catalog side already has genuine structured
`cores`/`crossSection` attrs per product (real DB data via
`CatalogProductDTO`), and cable/wire/splice product titles already embed
the same values as literal text (`"Кабель ВВГнг(А)-LS 2×1.5"`). A
customer's spec-file row also carries free-text `title` today, already
parsed, no new column needed. So a title-embedded cable-size token
(`"3х2.5"`-style) can be diffed against the matched product's real attrs
without inventing anything — it only ever asserts a mismatch when both
sides have a real parseable value.

**Fix shipped — the honest small slice:**

- `spec-import/matcher.ts`: `MatchableProduct` gained optional
  `cores`/`crossSection`; a new `extractDimensions()` regex reads a raw
  `<cores>x<crossSection>` token straight from the row's title (not
  through `normalize()`, which strips the decimal point the
  cross-section needs); `scoreCandidate` now sets a `technicalWarning`
  string on the result when the extracted size and the matched product's
  real attrs both exist and disagree.
- `spec-import-wizard.tsx`: renders that warning under each candidate,
  and — free, since the matcher already computed it but nothing rendered
  it — also now shows `differentFields` inline. Both notes are folded
  into the created project item's `note` field too, so the mismatch
  survives into the actual BOM line, not just the review screen.
- `matcher.test.ts`: three new cases (mismatch flagged, no signal on
  either side stays silent, matching sizes stay silent).

**Deliberately not this cycle:** voltage/current diffing, and dimension
diffing for categories whose titles don't embed `NxM` notation
(`armatura-sip`, `izolyatory`, `avtomaty`) — both genuinely need the
sheet parser extended with technical columns (there's already an
`attr:`-prefixed passthrough convention in the admin product importer's
`parse-sheet.ts` to model that on), which is real, separate work.
Verified: typecheck clean, lint has only the same pre-existing warnings,
45/45 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: voltage/current diffing, and dimension diffing for non-cable categories, still need `SPEC_IMPORT_COLUMNS`/`parse-sheet.ts` extended to optionally capture technical columns from an uploaded file (modeled on the existing `attr:` passthrough convention in the admin importer) — no downstream consumer for those columns exists yet, so building the parser extension alone would ship no visible value; do it together with whatever diffing will consume it.
- Phase 9: no lead-assignment automation.
- Phase 7 (smaller): `addProjectItem`/`saveCartAsProject` (the Project/BOM flow, separate from the cart) still trust whatever `priceTenge` the client sends verbatim, with no server-side re-check against catalog or company price — pre-existing, not introduced this cycle, but worth hardening later. Not fixed now because a naive fix would also break legitimate freeform (no-`productId`) BOM lines, which have no catalog price to re-resolve against.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 4 continued: voltage/current diffing. Needs `SPEC_IMPORT_COLUMNS`
(`src/config/spec-import-columns.ts`) and `parse-sheet.ts` extended to
optionally recognize technical-parameter columns in an uploaded file
(voltage, current — modeled on the existing `attr:` passthrough
convention already used by the admin product importer), then the same
`scoreCandidate` mismatch-flagging pattern extended to those fields.
Scope the column-mapping side carefully — it's the open-ended part.
