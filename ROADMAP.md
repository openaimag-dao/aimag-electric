# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                               |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                         |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                  |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                                                                                |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                      |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                   |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop (approve/request changes/reject), staff-editable quote line prices, and per-company reference prices (`CompanyPrice`) surfaced as a suggestion when pricing a quote — added this cycle. |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                   |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                               |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                         |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                       |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                         |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** only header-search
demand was logged into `SearchLog` — a customer landing on `/catalog?q=...`
(from the header's "show all results", a bookmark, or a shared link) left
no trace, so the admin "top queries" / "no-result queries" widget was
blind to a real share of search volume and, worse, to catalog-page
searches that find nothing.

**Fix shipped:** a new `logCatalogSearch(query, resultCount)` server
action (`search-actions.ts`) that writes into the _same_ `SearchLog` table
with the _same_ `kind: "search"` as header search — so it shows up in the
existing `topQueries`/`topZeroResultQueries` admin widget with no new UI.
Wired into `CatalogView` via a `useEffect` keyed on `filters.q`: since `q`
only ever enters the catalog page through a full navigation (there is no
live search box on the catalog page itself — confirmed no component reads
`filters.q` for typing, only `active-filter-chips.tsx` displays it as a
removable chip), logging once per distinct query text is a real "settled
search" event, not a some over-eager per-keystroke log. A `useRef` guard
prevents re-logging the same query when an unrelated filter (category,
page) changes while `q` stays put.

Deliberately scoped to _just_ the logging — no new admin UI (reuses the
existing widget), no attempt to distinguish "came from header" vs "came
from catalog page" (the existing `SearchLog` schema has no source column;
adding one is a separate, low-value change unless that split is ever
actually needed). Verified: typecheck clean, lint has only the same
pre-existing warnings, 42/42 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 9: no lead-assignment automation.
- Phase 7: `CompanyPrice` is a suggestion in the admin quote editor only — it does not yet flow into the public catalog/product price shown to a logged-in company member, nor into order totals. That's a materially larger change (threading per-request company context through `derivePrice()`'s hot, currently context-free read path) and needs real usage of the admin-side suggestion first to justify it.
- Phase 11: quote/order conversion funnel (does a search → lead to a quote → an order) is still untracked — `SearchLog` only knows about search+click, not what happens downstream.

## Next priority

Phase 11: quote/order conversion tracking — connect a submitted quote back
to the search query (if any) that led to it, so the admin widget can show
not just "what people search for" but "what search actually converts,"
the natural next layer once both search surfaces are logged. Alternative
if that proves too loosely-coupled to wire cleanly: start wiring
`CompanyPrice` into the actual customer-facing price a logged-in company
member sees (Phase 7's real payoff), scoped tightly to just the product
detail page rather than the whole catalog grid.
