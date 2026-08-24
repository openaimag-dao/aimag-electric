# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                  |
| --- | ------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                           |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                     |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                              |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                            |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                  |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                               |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop (approve/**request changes**/reject — added this cycle). No per-company contract pricing yet.                                       |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                               |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail. No lead-assignment automation or a distinct "engineer review" queue yet.                                                                                 |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                     |
| 11  | Data Intelligence              | **Partial**                 | Header-search demand now logged (query + result count + click-through) with an admin "top queries" / "no-result queries" widget — added this cycle. Full-catalog-page `?q=` search and quote/order conversion funnels still untracked. |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                     |

## This cycle's work

**Bottleneck identified:** Phase 11 (Data Intelligence) had zero search-demand
data — no way to see what customers actually search for, or what they search
for and never find, even though the header search and its zero-result CTA
(added in an earlier cycle) are the site's highest-traffic discovery surface.
Every "what should we stock / what should we fix in the catalog" decision was
a guess.

**Fix:** added a `SearchLog` table (self-heal, like every other table in this
app) logging two event kinds — `search` (query + result count, from
`searchSuggestions`) and `click` (query + the product slug actually opened,
from the header dropdown). Both writes are best-effort: a logging failure is
caught and swallowed so it can never break an actual search or click.
`adminService.dashboardInsights()` now surfaces two widgets on `/admin`: top
queries and top zero-result queries over the last 30 days, grouped straight
from the log — no fabricated numbers, an honest empty state when there's no
data yet.

**Deliberately out of scope this cycle:** the full `/catalog?q=` page's
filtering runs entirely client-side against an already-loaded product list
(see `catalog-view.tsx`/`use-catalog-filters.ts`), so logging its zero-result
searches needs a client → server ping, not just a repository call — a clean
follow-up, not bundled in here to keep this PR to one mechanism.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 11: `/catalog?q=` page search (client-side filtering) isn't logged yet, only header-search. No quote/order conversion funnel yet.
- Phase 9: no engineer-review queue or lead-assignment automation.
- Phase 7: no per-company/contract pricing.

## Next priority

Phase 9 (CRM & Automation) — a distinct "engineer review" queue for quotes/
projects that need technical judgment before a price can be quoted (ties
directly into Phase 4's still-partial matching: a `possible`-tier spec-import
match currently has no staff-facing follow-up once the customer accepts it
into their project). Smaller and more concretely scoped than building out
Phase 4's structured parameter comparison from scratch, and it's the piece
Phase 9's own "Lead → Request → Project → Quote" automation chain is
currently missing.
