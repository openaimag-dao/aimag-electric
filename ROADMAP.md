# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                                                                    |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                                                              |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                                                       |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                                                                                                                     |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                                                           |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                                                        |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, and `CompanyPrice` now surfaced both when staff price a quote AND on the product page for a logged-in company member — added this cycle. No contract pricing in cart/checkout totals yet. |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                        |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                    |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                              |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                            |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                              |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** last cycle's stated
next priority was quote/order conversion tracking — connecting a
submitted quote back to the search query that led to it. Investigated
first, and it doesn't hold up honestly: `SearchLog` has no session/user
column, `submitQuote` captures no referrer or query context, and grepping
the whole product/search/quote path (`search-bar.tsx`, `product-card.tsx`,
`quote-dialog.tsx`, `submitQuote`) turned up zero existing session or
query-carrying signal to attribute a quote to a search with. Building it
for real would mean inventing new tracking infrastructure — a session
cookie or threading `?q=` through every product link into the quote
form and a new schema column — which is a multi-file, schema-changing
feature, not the "next priority" scope the roadmap entry implied.
Deprioritized rather than faked with a made-up attribution.

**Picked instead (the roadmap's own stated fallback):** finished
`CompanyPrice`'s actual payoff — last cycle it only ever appeared as a
staff-facing suggestion in the quote editor; a logged-in company member
never saw their own negotiated price anywhere. The product detail page
(`/catalog/[slug]`) now resolves the viewer's company the same way
`/admin/quotes` does (`currentUser()` → `companyAdminRepository.forUser()`
→ `companyPriceAdminRepository.forCompaniesAndProducts()`, the exact
precedent already used by `/account` and `/account/company`) and, if a
reference price exists for this product, shows "Ваша цена по договору:
N ₸" in the purchase panel alongside the catalog price — never replacing
or feeding it into cart/checkout totals, which stay untouched this cycle.
An anonymous visitor or a company member with no price set simply sees
nothing extra, which is correct, not a gap. `derivePrice()` and every
other catalog read path remain untouched — this is one lookup added to
one page. Verified: typecheck clean, lint has only the same pre-existing
warnings, 42/42 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 9: no lead-assignment automation.
- Phase 7: `CompanyPrice` is now visible to both staff and the customer, but still doesn't flow into cart/checkout totals or order pricing — a company member sees "your contract price" as information, but adding to cart / placing an order still uses the catalog price. Making the negotiated price actually apply at checkout is the natural next step, but is a bigger, more consequential change (money actually charged) that deserves its own careful cycle.
- Phase 11: quote/order conversion funnel is still untracked, and — per this cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 7: make a company's `CompanyPrice` actually apply when that
member adds the product to cart / requests a quote, not just display as
information on the product page. This is the natural conclusion of the
last two cycles (staff can set it, staff can see it when quoting, the
customer can now see it) but touches money customers are actually
charged, so scope it carefully: likely just `AddToCartButton`/`QuoteDialog`
on the product page reading the same `companyPriceTenge` already resolved
this cycle and using it as the item's `priceTenge` instead of the catalog
price — not a change to `derivePrice()` or any other read path.
