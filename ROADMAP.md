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
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, `CompanyPrice` applied consistently across every cart/quote entry point including the main `/catalog` grid, and now every write path that turns a real catalog product into money on a project or a quote (`addProjectItem`, `saveCartAsProject`, `submitQuote` — added this cycle) re-derives the price server-side instead of trusting the client.                                                                                    |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                                                                                                                                                                                                                          |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** `submitQuote` — the
"Получить КП" flow behind the header, product page, and cart — had the
same client-trusted-price gap that `addProjectItem`/`saveCartAsProject`
had before last cycle's fix, but is used far more (every quote-request
entry point in the app), so it needed careful tracing rather than a
copy-paste of the previous fix.

**Traced every call site before touching it.** `QuoteDialog`/`QuoteForm`
is used two ways: with no `items` prop at all (header, hero, footer, CTA
sections, catalog empty-state — a pure message-only lead, no pricing
involved), or with a real `CartItem[]` (`useCart()` on `/cart`,
`purchase-panel.tsx`'s single-product dialog, and
`project-detail-client.tsx`'s project→quote conversion, which explicitly
filters out any item without a `productId` before building the list).
`quoteItemSchema.productId` is required server-side too. Same shape as
last cycle's finding: whenever `items` is present, every entry always
carries a real `productId`; the genuinely freeform case is the entire
array being absent, not an individual priced item.

**Fix shipped:**

- `company-price-service.ts`: added `resolveCatalogPrices()` (moved from
  `project-actions.ts`, unchanged) — now the one shared place both
  `project-actions.ts` and `quote-actions.ts` get an authoritative price
  from.
- `quote-actions.ts`: `submitQuote` now re-derives every item's price via
  one bulk `resolveCatalogPrices()` call before writing the quote,
  ignoring the client-sent `priceTenge` — identical treatment to
  `addProjectItem`/`saveCartAsProject`. The message-only (no `items`)
  path is untouched.

Verified: typecheck clean, lint has only the same pre-existing warnings,
48/48 tests pass, production build succeeds. No new tests added — same
reasoning as last cycle (`quote-actions.ts` has no existing test
coverage to extend); verified by reading the resulting logic and every
call site instead.

## Known issues / deferred

- Phase 4: dimension diffing still only covers categories whose titles embed `NxM` notation (cable/wire/splice) — fittings/insulators/breakers have no such signal and would need a different source (likely a file column, same as voltage). Current/amperage diffing needs a real `Attribute` + seeded values first — a data decision, not scoped as engineering work.
- Phase 9: no lead-assignment automation.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Every catalog-product write path that turns into money on a quote or
project (`addProjectItem`, `saveCartAsProject`, `submitQuote`) now
re-derives its price server-side — the price-trust gap flagged over the
last two cycles is closed everywhere it was found. No single obvious
next item stands out; scope the next cycle by re-reading the Phase
status table above for the next "Partial"/"Mostly complete" gap worth a
focused look (Phase 4's remaining non-cable-category dimension signal,
or Phase 9's lead-assignment automation, are the two least-explored
candidates), or ask the user for direction if none looks like a clean
one-cycle slice.
