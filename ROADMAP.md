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
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail. An uncertain ("possible"-tier) spec-import match now carries a review flag through to the quote — added this cycle. No lead-assignment automation yet.   |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                     |
| 11  | Data Intelligence              | **Partial**                 | Header-search demand now logged (query + result count + click-through) with an admin "top queries" / "no-result queries" widget — added this cycle. Full-catalog-page `?q=` search and quote/order conversion funnels still untracked. |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                     |

## This cycle's work

**Bottleneck identified:** an uncertain spec-import match had no staff-facing
follow-up. "Загрузить ТЗ" already classifies each row `exact`/`possible`/
`not_found` (see `lib/spec-import/matcher.ts`), and a customer can confirm a
`possible` match into their project — but once confirmed, it became an
ordinary project line indistinguishable from an exact match or a manually
added item. If that project became a quote, staff had no way to know "this
line was a guess, verify the substitution before pricing it" — exactly the
gap Phase 4's brief calls out ("If uncertain: ENGINEER REVIEW REQUIRED").

**Fix:** threaded the existing (previously unused end-to-end) `note` field —
already present on both `ProjectItem` and `QuoteItem` in the schema, no
migration needed — from the spec-import wizard through to both the customer
project view and the admin quote view:

- `spec-import-wizard.tsx` sets a specific note ("Возможное совпадение по
  «X» — сверьте характеристики...") only on `possible`-tier confirmations;
  `exact` matches get no note, same as before.
- `CartItem` gained an optional `note` field, threaded through
  `saveCartAsProject` → `ProjectItem.note` → the "Запросить КП" quote
  submission → `QuoteItem.note`.
- `ProjectItemsPanel` (customer) and `quotes-manager.tsx` (staff) both now
  render the note inline per item, and the admin quotes list shows a small
  warning glyph on any row with a flagged item — a review "queue" without a
  new page: the existing quotes list already sorts/filters by status, this
  just adds the one signal that was missing.

**Deliberately out of scope:** a dedicated `/admin/quotes?review=1` filter
view, and lead-assignment automation — the flag is visible everywhere it's
needed for now; a dedicated filter is a small follow-up once there's enough
volume of flagged quotes to make scrolling past them a real problem.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 11: `/catalog?q=` page search (client-side filtering) isn't logged yet, only header-search. No quote/order conversion funnel yet.
- Phase 9: no lead-assignment automation; no dedicated "needs review" filter view (the flag is visible, just not filterable yet).
- Phase 7: no per-company/contract pricing.

## Next priority

Phase 7 (B2B Commercial Engine) — per-company/contract pricing. Every price
today is the same catalog price for every customer; a repeat B2B buyer with
negotiated terms has no way to see "their" price anywhere in the portal or
on a quote. This is the last concretely-scoped gap in the core commercial
flow before the roadmap's remaining phases are either long-term-deferred by
design (Marketplace, AI) or need a product decision this session can't make
unilaterally (AI Copilot).
