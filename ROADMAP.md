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
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                           |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                     |
| 11  | Data Intelligence              | **Partial**                 | Header-search demand now logged (query + result count + click-through) with an admin "top queries" / "no-result queries" widget — added this cycle. Full-catalog-page `?q=` search and quote/order conversion funnels still untracked. |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                     |

## This cycle's work

**Bottleneck re-assessed:** last cycle's "next priority" was per-company
contract pricing (Phase 7). Investigating it before building turned up a
foundational gap that makes it premature: `derivePrice()`
(`server/mappers/product.ts`) is a pure, context-free function feeding
every price shown anywhere in the app (catalog grid, product page, search
suggestions) — there's no per-request "current user's company" threaded
through that whole read path, and adding it there is a large, invasive
change to a hot/cached path. More importantly: **staff has no way to edit a
quote's line-item price at all** today (`admin/quote-actions.ts` has no such
action) — pricing is communicated off-platform once a quote is submitted.
A `CompanyPrice` table would sit unused without that editing capability
existing first, so building it now would be dead weight, not depth.
Deprioritized rather than built half-way.

**Picked instead:** the smaller, concretely-scoped follow-up explicitly
flagged as deferred at the end of last cycle — a "needs review" filter on
`/admin/quotes`, finishing what the previous cycle's review-flag feature
started (the flag existed and was visible, but wasn't filterable). Added a
toggle button ("Требуют проверки (N)") next to the existing search toolbar
in `quotes-manager.tsx` that filters the list to quotes with at least one
flagged item — pure client-side filter over data already being fetched, no
new query, no schema change.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 11: `/catalog?q=` page search (client-side filtering) isn't logged yet, only header-search. No quote/order conversion funnel yet.
- Phase 9: no lead-assignment automation.
- Phase 7: no per-company/contract pricing — **blocked on** admin quote-item price editing not existing yet (see above); build that first, then pricing has somewhere real to plug into.

## Next priority

Admin quote-item price editing — let staff set/adjust each line's price
directly on a quote from `/admin/quotes`, instead of only ever echoing back
whatever price the customer's cart had at submission time. This is smaller
and safer than it sounds (one new admin action + an inline-editable amount
field in the existing quote item table) and it's the actual prerequisite
Phase 7's contract pricing needs to be anything other than an unused table —
once staff can edit a quote's price, a per-company suggested/reference price
has somewhere real to surface.
