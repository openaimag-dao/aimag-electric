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
| 11  | Data Intelligence              | **Partial**                 | Header-search demand now logged (query + result count + click-through) with an admin "top queries" / "no-result queries" widget — added this cycle. Full-catalog-page `?q=` search and quote/order conversion funnels still untracked.                                                     |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                         |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** per-company contract
pricing had no way to surface — the quote item price editor shipped last
cycle was the missing prerequisite, and it now exists.

**Fix shipped:** a new self-healed `CompanyPrice` table (companyId +
productId → `amountTiyn`, unique per pair) with full admin CRUD — a
"Договорные цены" panel on `/admin/companies/[id]` (add/edit/remove,
mirroring the existing team-members panel) lets staff set a reference
price per product for a company. That price surfaces as a clickable
suggestion ("Цена компании: N ₸") in the quote item price editor on
`/admin/quotes`, filling the input on click — never applied automatically.

Resolving _which_ company a quote belongs to only ever goes through the
real `Quote.userId → CompanyMember → Company` relation (a new batched
`companyAdminRepository.forUsers()` lookup) — matching the codebase's
existing rule that `Quote` has no direct company relation and nothing
about a company association is ever guessed from free-text labels. A
quote from a guest checkout or a user not on any company simply gets no
suggestion, which is the correct, silent behavior, not a bug.

Deliberately did **not** touch `derivePrice()` or any public catalog/read
path — `CompanyPrice` is admin-only data surfaced in one admin view this
cycle, not a pricing engine wired into checkout. Verified: typecheck
clean, lint has only the same pre-existing warnings, 42/42 tests pass,
production build succeeds.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 11: `/catalog?q=` page search (client-side filtering) isn't logged yet, only header-search. No quote/order conversion funnel yet.
- Phase 9: no lead-assignment automation.
- Phase 7: `CompanyPrice` is a suggestion in the admin quote editor only — it does not yet flow into the public catalog/product price shown to a logged-in company member, nor into order totals. That's a materially larger change (threading per-request company context through `derivePrice()`'s hot, currently context-free read path) and needs real usage of the admin-side suggestion first to justify it.

## Next priority

Phase 11: log `/catalog?q=` page search (the client-side filter box on the
catalog page itself), reusing the `SearchLog` table and
`logSearchClick`/`searchSuggestions` infra already built for header
search — currently only header-search demand is tracked, so catalog-page
query volume and no-result terms are invisible to the "top queries" admin
widget. Alternative if a bigger swing is wanted instead: start wiring
`CompanyPrice` into the actual customer-facing price a logged-in company
member sees (the real payoff of this cycle's table), scoped tightly to
just the product detail page rather than the whole catalog grid.
