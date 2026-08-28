# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                                                                                                                                |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                                                                                                                          |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                                                                                                                   |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                                                                                                                                                                                 |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                                                                                                                       |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                                                                                                                    |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, and `CompanyPrice` surfaced to staff, shown to the customer, and now actually quoted when a company member requests a KП straight from the product page — added this cycle. Cart and every other add-to-cart entry point still use the catalog price. |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                                                                                    |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                                                                                |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                          |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                                        |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                          |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** last cycle's stated
next priority was making `CompanyPrice` actually apply, not just display,
when a company member adds to cart or requests a quote — proposed as a
small swap of `priceTenge: product.price` for `companyPriceTenge ??
product.price` in `purchase-panel.tsx`'s two CTAs. Investigated the blast
radius before touching either one, since this is real money a customer
is charged/quoted, not a display tweak.

**What the investigation found:** the `QuoteDialog` half is genuinely
safe — a KП requested from the product page is one immediate submission
(`submitQuote` → `QuoteItem.amountTiyn`, unmodified) with no persistence
or merge step. The `AddToCartButton` half is not: `CartItem`s are
persisted to `localStorage`, and `cart-provider.tsx`'s `addItem` silently
**keeps the first price written** when the same product is added twice —
so if only the product-page button read the company price, a customer
who happened to add the same product from `/catalog`'s grid,
`/compare`, or an account item-add flow first (none of which resolve
`companyPriceTenge` today) would silently lock in the _catalog_ price for
that cart line, with no indication which entry point "won." That's a
real inconsistency in what the customer is actually charged, not a
cosmetic gap — worth catching before shipping, not after.

**Fix shipped:** narrowed to just the safe half — `purchase-panel.tsx`'s
`QuoteDialog` now quotes at `companyPriceTenge ?? product.price` when a
company member requests a KП directly from the product page. Left
`AddToCartButton` on `product.price` deliberately, with a comment
pointing at this reasoning and at the deferred follow-up below.
`derivePrice()` and every other catalog read path remain untouched.
Verified: typecheck clean, lint has only the same pre-existing warnings,
42/42 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 9: no lead-assignment automation.
- Phase 7: `CompanyPrice` still doesn't flow into cart/checkout — applying it there needs either (a) resolving `companyPriceTenge` consistently at every add-to-cart entry point (catalog grid `product-card.tsx`, `/compare`, account item-add flows) so the same product always carries the same price into the cart, or (b) fixing `cart-provider.tsx`'s `addItem` silently keeping the first-written price on a merge — likely both, which is why it's deferred rather than done half-way.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 7: extend `CompanyPrice` to the cart, correctly this time — fix
`cart-provider.tsx`'s `addItem` so a merged cart line uses a consistent
price (not silently whichever was written first), and resolve
`companyPriceTenge` at the other add-to-cart entry points found this
cycle (`product-card.tsx`, `/compare`, account item-add) so a company
member gets the same price for the same product no matter where they add
it from. Larger than one file, so worth its own careful cycle rather
than a rushed follow-on to this one.
