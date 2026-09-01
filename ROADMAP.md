# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                         |
| --- | ------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                  |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                            |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                     |
| 4   | Engineering Intelligence       | **Partial**                 | Matching is SKU/title/manufacturer similarity only — no structured technical-parameter comparison (voltage/current/dimensions) or explicit "differs on X" / "needs engineer review" output.                                                                                   |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                         |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                      |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, and `CompanyPrice` now applied consistently across every cart/quote entry point, including the main `/catalog` grid — added this cycle. |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                      |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                  |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                            |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                          |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                            |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** the main `/catalog`
grid was the one remaining entry point that still quoted the catalog
price instead of a logged-in company member's negotiated `CompanyPrice`.
ROADMAP.md floated two options: server-side pagination for `/catalog`, or
a small client-side price-lookup for just the visible page. Investigated
before picking one, since "server-paginate the whole catalog" sounded
like the more thorough fix at first glance.

**Investigation found the server-pagination option isn't real.**
`catalog-service.ts`'s `loadProducts()` does load every published
product unpaginated, but it's used only by `/catalog` itself — not
shared with the home page (`homeService.popularProducts()` is separate),
so the earlier-assumed wider blast radius doesn't exist. But
`/catalog`'s filter/sort/pagination all run client-side in the browser
(`queryCatalog`); moving to server pagination would mean either
re-fetching from the server on every filter tweak (a real UX regression
from today's instant filtering) or doing exactly what option (b) already
does — bulk-resolve prices for just the visible page. It's not a
distinct bigger option, just a repackaging of the smaller one. Catalog
size today is also small (~43 seeded products, `PAGE_SIZE = 9`), so
there's no real performance case for a bigger rewrite either.

**Fix shipped — option (b):**

- `catalog-view.tsx`: added a `useEffect` keyed on the current page's
  product ids that calls the existing `getProductsByIds` (already
  public, rate-limited, and resolves `companyPriceTenge` via
  `withCompanyPrices` — the same mechanism `/compare` already uses) and
  merges the result into local state. No new server action needed.
  `ProductCard` renders the merged list, so its existing "Ваша цена: N ₸"
  line and company-priced add-to-cart now work on the catalog grid too,
  same as everywhere else.

`CompanyPrice` is now applied consistently across every cart/quote entry
point in the app — catalog grid, product page, compare, favorites,
recently viewed, related products, account item-add. Verified: typecheck
clean, lint has only the same pre-existing warnings, 42/42 tests pass,
production build succeeds.

## Known issues / deferred

- Phase 4: matching has no structured technical-parameter comparison yet — confirmed this cycle that the ТЗ parser (`spec-match-service.ts`'s `SpecFileRow`) doesn't even extract technical params (only sku/title/qty/unit/manufacturer) from customer sheets, so this needs new parser work, not just new matching logic. Still the next big scoped item.
- Phase 9: no lead-assignment automation.
- Phase 7 (smaller): `addProjectItem`/`saveCartAsProject` (the Project/BOM flow, separate from the cart) still trust whatever `priceTenge` the client sends verbatim, with no server-side re-check against catalog or company price — pre-existing, not introduced this cycle, but worth hardening later. Not fixed now because a naive fix would also break legitimate freeform (no-`productId`) BOM lines, which have no catalog price to re-resolve against.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 4: structured technical-parameter comparison. Today's spec-import
matcher (`spec-import/matcher.ts`) only scores sku/title/manufacturer
similarity — no voltage/current/dimensions diffing, no explicit "differs
on X" / "needs engineer review" output. Confirmed this cycle that the
upstream sheet parser doesn't extract technical params at all yet, so
scope the parser extension first (open-ended column-mapping problem, no
fixed schema) before the matching/UI work — likely bigger than one
cycle; split it if so.
