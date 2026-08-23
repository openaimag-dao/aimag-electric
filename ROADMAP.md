# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                              |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                       |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions. |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.          |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                        |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                              |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                           |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop (approve/**request changes**/reject — added this cycle). No per-company contract pricing yet.                   |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                           |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail. No lead-assignment automation or a distinct "engineer review" queue yet.                                                             |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                 |
| 11  | Data Intelligence              | **Missing**                 | No search-analytics/no-result tracking, no quote/order conversion funnel. Catalog Health covers data quality, not demand.                                                                                          |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                 |

## This cycle's work

**Bottleneck identified:** Phase 7's commercial flow (`QUOTE → NEGOTIATION → APPROVAL`)
had no negotiation step — a customer could only Approve or Reject a КП. Rejecting
was terminal (`LOST`), so a customer who just wanted a revised price/quantity/date
had to start a brand new quote request from scratch, and staff lost the thread
of what needed to change.

**Fix:** added a third response — "Запросить изменения" — reusing the exact
approve/reject pipeline (`respondToQuote` → `quoteRepository.respond`), just
transitioning the quote back to `IN_PROGRESS` instead of `LOST` so the deal
stays alive with the customer's note attached; the admin quote view now shows
"запросил изменения" distinctly from "отклонил". No schema change — reused the
existing `QuoteStatus.IN_PROGRESS` value; the `respondedAt`-set + `IN_PROGRESS`
combination unambiguously identifies a changes-request vs. a fresh unsent quote.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 11: no demand/conversion analytics (search, no-result, funnel).
- Phase 9: no engineer-review queue or lead-assignment automation.
- Phase 7: no per-company/contract pricing.

## Next priority

Phase 11 (Data Intelligence) — specifically **search analytics** (query,
zero-result, click-through). It's the smallest, most concretely scoped next
step (an event write on three already-instrumented server actions, plus one
admin dashboard widget) and it's a prerequisite for measuring almost
everything else on this roadmap honestly (what customers search for and don't
find is real, unfabricated demand data AIMAG doesn't currently capture at all).
