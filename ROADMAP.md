# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                    |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                             |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                       |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                                                              |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                    |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                 |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop (approve/request changes/reject), staff can now edit a quote's line-item price directly from `/admin/quotes` — added this cycle. No per-company contract pricing yet. |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                 |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                             |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                       |
| 11  | Data Intelligence              | **Partial**                 | Header-search demand now logged (query + result count + click-through) with an admin "top queries" / "no-result queries" widget — added this cycle. Full-catalog-page `?q=` search and quote/order conversion funnels still untracked.                                   |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                       |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** staff had no way to
edit a quote's line-item price at all — `admin/quote-actions.ts` had no
such action, so a quote's amount was frozen at whatever the customer's
cart showed on submission, and any price adjustment had to happen
off-platform. This was also the blocker on per-company contract pricing
(Phase 7): a `CompanyPrice` table would have nowhere real to surface
without a price-editing UI to show it in.

**Fix shipped:** `quoteAdminRepository.updateItemPrice(itemId, amountTiyn)`

- a staff-gated `updateQuoteItemPrice` server action
  (`admin/quote-actions.ts`, validates non-negative finite price), wired into
  an inline editor in the quote item breakdown table in `quotes-manager.tsx`
  — click the price (pencil-adorned) to reveal a unit-price input with
  save/cancel (Enter/Escape also work), local dialog state patches
  immediately on save so the open quote reflects the new price without a
  full refetch. `QuoteItem.amountTiyn` is a real applied-migration column
  (`20260820000000_quote_items_pricing`), not a self-heal-only field, so no
  new DDL was needed. Verified: typecheck clean, lint has only the same
  pre-existing warnings, 42/42 tests pass, production build succeeds.

**Deliberately out of scope this cycle:** actually building per-company
contract pricing (Phase 7) — now unblocked, but a `CompanyPrice`
table + read-path wiring through `derivePrice()` is a separate, larger
change that deserves its own cycle rather than being bolted onto this one.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 11: `/catalog?q=` page search (client-side filtering) isn't logged yet, only header-search. No quote/order conversion funnel yet.
- Phase 9: no lead-assignment automation.
- Phase 7: no per-company/contract pricing yet — the editing prerequisite now exists (see above), so this is the natural next build.

## Next priority

Per-company/contract pricing (Phase 7): a `CompanyPrice` table (company +
product/category → reference price) surfaced first in the admin quote
view staff already use to price a line (now editable, this cycle) as a
suggested starting price, before considering the larger, invasive change
of threading company context through `derivePrice()`'s hot catalog read
path. Alternative if that turns out to be too large for one cycle: Phase 11
`/catalog?q=` search logging, reusing the `SearchLog` infra already built
for header search.
