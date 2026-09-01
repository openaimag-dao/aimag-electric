# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                                                                                                                                                                                                                                                                                                            |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                                                                                                                                                                                                                                                                                                     |
| 4   | Engineering Intelligence       | **Partial**                 | SKU/title/manufacturer matching plus structured checks: cable dimension (cores×cross-section, from title text) and voltage (from an optional file column) mismatches against the matched product's real attrs are now flagged explicitly. Current/amperage diffing is not built and won't be — no product in the catalog carries a current attribute at all, so there is no real data to diff against; adding one would mean inventing a spec, not matching one. General "differs on X" for non-cable categories with no `NxM` title notation still needs more source signal. |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, `CompanyPrice` applied consistently across every cart/quote entry point including the main `/catalog` grid, and — added this cycle — the Project/BOM flow (`addProjectItem`/`saveCartAsProject`) now re-derives the price server-side for every real catalog product instead of trusting the client.                                                                                                                                    |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                                                                                                                                                                                                                          |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** the Project/BOM
flow's price-trust gap. `addProjectItem` and `saveCartAsProject` wrote
whatever `priceTenge` the client sent straight into the DB, with no
server-side re-check — flagged as "worth hardening" but previously left
alone because a naive fix looked like it would also break legitimate
freeform (no-`productId`) BOM lines.

**Traced every call site before touching it, since this is money that
ends up on a staff-reviewed quote.** Every current caller of
`addProjectItem` (`add-project-item.tsx`'s catalog search-and-add,
`project-items-panel.tsx`'s alternative-swap) and every item passed to
`saveCartAsProject` (the cart's "Сохранить как проект" button, and
`spec-import-wizard.tsx`'s ТЗ-matched rows) always supplies a real
catalog `productId` — confirmed further by `saveCartAsProjectSchema`
itself, which requires a non-empty `productId` on every item. The
"freeform BOM line" the earlier note worried about doesn't exist
anywhere in the UI today; the schema just still technically allows it.

**Fix shipped:**

- New `company-price-service.ts`: extracted the company-price lookup
  that `product-lookup-actions.ts` already had private and duplicated
  (`withCompanyPrices`) into a shared `companyPricesForCurrentUser()`,
  since `project-actions.ts` now needs the same lookup too — no
  behavior change for the existing callers, just de-duplication.
- `project-actions.ts`: new `resolveCatalogPrices()` re-derives the
  authoritative price (company price when set, else catalog price) for
  any real product id, ignoring the client's `priceTenge` entirely.
  `addProjectItem` applies it whenever a `productId` is present — the
  input schema's optional/freeform case is left exactly as before, so
  nothing observable breaks if that path is ever actually used.
  `saveCartAsProject` applies it to every item in one bulk lookup, since
  every item there always has a real `productId`.

Verified: typecheck clean, lint has only the same pre-existing warnings,
48/48 tests pass, production build succeeds. No new tests added —
`project-actions.ts` has no existing test coverage to extend (it's a DB-
backed server action, consistent with the rest of the untested action
layer); verified by reading the resulting price-resolution logic and
every call site instead.

## Known issues / deferred

- Phase 4: dimension diffing still only covers categories whose titles embed `NxM` notation (cable/wire/splice) — fittings/insulators/breakers have no such signal and would need a different source (likely a file column, same as voltage). Current/amperage diffing needs a real `Attribute` + seeded values first — a data decision, not scoped as engineering work.
- Phase 9: no lead-assignment automation.
- Phase 7 (smaller, found this cycle): `submitQuote` (the header/product-page/cart "Получить КП" flow, separate from Project/BOM) still trusts the client-sent `priceTenge` verbatim the same way `addProjectItem`/`saveCartAsProject` used to — structurally the same gap, not fixed this cycle since it's a different, higher-traffic entry point and staff already review/edit every quote's price in `/admin/quotes` before a binding КП goes out, which lowers the real-world severity. Worth the same treatment in a future cycle.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Apply the same server-side price re-derivation this cycle just shipped
for Project/BOM to `submitQuote` (see Known issues above) — same shape
of fix (`resolveCatalogPrices`-style lookup keyed on `productId`,
freeform/no-id lines left untouched), but touches a much higher-traffic,
more central path (every "Получить КП" entry point in the app), so scope
and test it carefully before shipping. Alternative if that's judged too
risky for one cycle: pick a fresh, unrelated roadmap item instead.
