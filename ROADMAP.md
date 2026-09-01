# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                     |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                              |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                        |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                 |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                                                               |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                     |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                  |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, and `CompanyPrice` now applied consistently across every cart/quote entry point except the main `/catalog` grid — added this cycle. |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                  |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                              |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                        |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                      |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                        |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** `CompanyPrice` only
applied when a company member requested a KП straight from the product
page's `QuoteDialog` — every other add-to-cart entry point (catalog grid,
`/compare`, favorites, recently viewed, related products, account
item-add) still quoted the catalog price, and `cart-provider.tsx`'s
`addItem` silently kept whichever price was written _first_ on a merge —
so even the one fixed entry point could get silently overridden by an
unfixed one. Investigated the full scope first (this is money a customer
is actually charged), since a first read suggested one line's worth of
change but the actual blast radius was several files.

**Fix shipped, in full except one deliberate exception:**

- `cart-provider.tsx`: `addItem`'s merge branch now takes every field
  from the new write, not just `qty` — a re-add always reflects the
  latest known price instead of freezing on the first one.
- `purchase-panel.tsx`: `AddToCartButton` now quotes
  `companyPriceTenge ?? product.price` too (previously only `QuoteDialog`
  did).
- `product-lookup-actions.ts`: `getProductsByIds` (feeds `/compare`,
  favorites, recently viewed) and `getProductAlternatives` (feeds the
  project alternatives swap in the account area) now resolve and attach
  `companyPriceTenge` per product via one bulk
  `companyPriceAdminRepository.forCompaniesAndProducts()` call — a new
  optional field on the shared `CatalogProduct` type.
- `product-card.tsx` (used by favorites/recently-viewed/related-products,
  **not** the main catalog grid — see below): reads
  `companyPriceTenge ?? price` for its add-to-cart button and shows a
  small "Ваша цена: N ₸" line when set.
- `catalog/[slug]/page.tsx`: the related-products list gets its company
  prices from the same bulk lookup already done for the current product
  (one query covers both, not N).
- `compare-page-client.tsx`, `project-items-panel.tsx`: updated to read
  the now-available `companyPriceTenge` instead of the catalog price.

**Deliberately not touched:** the main `/catalog` grid. Traced it and
found `/catalog` loads _every_ product server-side once (cached, shared
across other pages) and hands the full array to a client component that
paginates/filters entirely in the browser — there's no server-rendered
"visible page" to bulk-resolve company prices against. Resolving it for
every product in the whole catalog up front (most of which no one will
ever see) would be wasteful, and folding a per-viewer field into a
cached/shared mapper output is a real architecture decision, not a
drop-in edit — `product-card.tsx`'s new field simply stays `undefined`
there today, which is correct default behavior (falls back to catalog
price), not a bug. Verified: typecheck clean, lint has only the same
pre-existing warnings, 42/42 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet.
- Phase 9: no lead-assignment automation.
- Phase 7: the main `/catalog` grid still shows only the catalog price — needs a real perf/architecture decision (server-paginate `/catalog` vs. a separate client-side price-enrichment fetch keyed on the post-filter visible page) before wiring `CompanyPrice` in there too.
- Phase 7 (smaller, found this cycle): `addProjectItem`/`saveCartAsProject` (the Project/BOM flow, separate from the cart) still trust whatever `priceTenge` the client sends verbatim, with no server-side re-check against catalog or company price — pre-existing, not introduced this cycle, but worth hardening later. Not fixed now because a naive fix would also break legitimate freeform (no-`productId`) BOM lines, which have no catalog price to re-resolve against.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 7: decide and build company pricing for the main `/catalog` grid —
the one remaining entry point. Needs a scoping decision first: either (a)
move `/catalog` to server-side pagination so there's a bounded "visible
page" to bulk-resolve prices against (a bigger structural change, but
fixes the same N-vs-1-query concern for any future per-viewer data), or
(b) keep client-side filtering and add a small client-side price-lookup
call for just the visible page after filtering settles. Alternative if
that turns out too large for one cycle: Phase 4's structured
technical-parameter comparison, still untouched since it was first
flagged.
