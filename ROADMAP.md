# AIMAG Electric — Roadmap

Tracks the product's maturity against the 12-phase B2B procurement platform
vision (Foundation → Catalog → Procurement → Engineering Intelligence → AI
Copilot → Supplier Engine → Commercial Engine → Customer Portal → CRM →
Marketplace → Data Intelligence → AI Sales Agent). Updated at the end of each
development cycle — see `docs/AUDIT_REPORT.md` for the historical July 2026
infra/security audit this build on.

## Phase status

| #   | Phase                          | Status                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Foundation             | **Complete**                | RBAC, rate limiting, security headers, audit log, branded error pages, DB self-heal, CI (typecheck/lint/format/test/build), Vitest coverage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2   | Catalog Operating System       | **Complete**                | Full product master data (SKU/brand/category/images/docs/specs/pricing/stock), admin CRUD with bulk edit/publish/delete (confirmed), Catalog Health data-quality dashboard, related products + analog suggestions.                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3   | Procurement Engine             | **Mostly complete**         | Projects (BOM), deterministic "Загрузить ТЗ" spec-import matcher (SKU/title, exact/possible/not_found tiers, customer-confirmed before writing), Project → Quote, Quote → Order, Order → repeat purchase.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | Engineering Intelligence       | **Partial**                 | SKU/title/manufacturer matching plus structured checks: cable dimension (from title text, or an optional cross-section file column for products whose titles don't embed a size), and voltage (optional file column) mismatches against the matched product's real attrs are now flagged explicitly — the cross-section column closes the `armatura-sip` gap specifically, added this cycle. Current/amperage diffing is not built and won't be — no product in the catalog carries a current attribute at all, so there is no real data to diff against; adding one would mean inventing a spec, not matching one. |
| 5   | AI Procurement Copilot         | **Missing**                 | No AI system anywhere in the codebase. Not started — large scope, needs explicit product decision before building (real catalog grounding, no invented specs/prices).                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6   | Supplier & Availability Engine | **N/A for now**             | Single-supplier business (AIMAG's own warehouses/stock) — no multi-supplier data exists to compare. Correctly not faked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 7   | B2B Commercial Engine          | **Mostly complete**         | Company/Customer/Deal/Quote/Order pipeline, company self-service team management, negotiation loop, staff-editable quote line prices, `CompanyPrice` applied consistently across every cart/quote entry point including the main `/catalog` grid, and now every write path that turns a real catalog product into money on a project or a quote (`addProjectItem`, `saveCartAsProject`, `submitQuote` — added this cycle) re-derives the price server-side instead of trusting the client.                                                                                                                          |
| 8   | Customer Portal                | **Complete**                | Dashboard, projects, quotes (with a direct link to the prepared КП + PDF download), orders (with delivery/documents + reorder), company team management.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes now filterable on `/admin/quotes` — added this cycle. No lead-assignment automation yet.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                                                                                                                                                                                                                                                                |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** no single obvious
next item stood out after the price-trust work closed. Investigated the
roadmap's own two candidates — Phase 4's remaining non-cable dimension
signal, and Phase 9's lead-assignment automation — before picking
either, since both were flagged as under-explored.

**Phase 9 (lead-assignment automation): investigated, not a clean
slice.** `Customer.ownerId`/`Deal.ownerId` already exist and are
manually assignable today via a two-click dropdown
(`customer-form.tsx`, `deal-form.tsx`) populated from real
ADMIN/MANAGER users — so the "assignment" plumbing isn't missing.
What's actually missing is that an incoming `Quote` never links to a
Customer/Deal at all (`Quote.customerId` exists in the schema but no
write path ever sets it) — automating "assignment" meaningfully would
mean first deciding whether/how quotes should auto-link to CRM records,
which is a product decision, not an engineering gap. Deferred; reframed
in Known issues below as a question for the user rather than a task.

**Phase 4 (non-cable dimension diffing): real, scoped, honest slice —
shipped.** Checked every non-cable category's actual seeded attrs:
`izolyatory`/`avtomaty`/`vysokovoltnoe` have no `crossSection` value at
all (only `voltage`, already covered), and `mufty` titles already embed
an `NxM` token (already covered by `extractDimensions`). Only
`armatura-sip` (fittings) has real, distinguishing `crossSection` values
(16/25/35/70/95 mm²) with titles that are a single number
("Зажим анкерный ЗАБ 16"), which the title-regex path can't parse.

**Fix shipped:**

- `spec-import-columns.ts`: new optional "Сечение" file column, mirrors
  the existing "Напряжение" column exactly.
- `spec-import-actions.ts`: extracted the voltage-parsing logic into a
  shared `parseOptionalNumber()` (tolerant of a trailing unit and a
  comma decimal) and reused it for the new column — no behavior change
  for voltage.
- `spec-match-service.ts`/`matcher.ts`: `SpecFileRow`/`SpecRowInput`
  gained `crossSection`; `scoreCandidate` diffs it against the matched
  product's real `crossSection` — but only when the title didn't already
  supply a size via `extractDimensions()`, so cable/wire/splice rows
  never get a second, redundant "сверьте сечение" warning.
- `matcher.test.ts`: three new cases (fitting-style mismatch flagged,
  silent with no column value, title-embedded size takes priority over
  the column so no duplicate warning).

Verified: typecheck clean, lint has only the same pre-existing warnings,
51/51 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: current/amperage diffing needs a real `Attribute` + seeded values first — a data decision, not scoped as engineering work.
- Phase 9: lead-assignment automation isn't a ready engineering task — the manual owner/assignee plumbing already exists on Customer/Deal, but nothing ever links an incoming Quote to a Customer/Deal in the first place. The real next question (worth asking the user/product owner directly, not scoping blind) is: should a new quote auto-link to an existing Customer by phone/email, and should that Customer's `ownerId` auto-assign (e.g. round-robin) if unset?
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Phase 9's lead-assignment question (see Known issues above) needs a
product decision before it can be scoped as engineering work — ask the
user directly rather than guessing. Absent that, re-read the Phase
status table for the next "Partial"/"Mostly complete" gap: Phase 11's
conversion-funnel tracking is the least-explored remaining item, though
an earlier cycle already found no cheap honest signal to build it on —
worth a fresh look with a specific narrower question (e.g. just
quote→order, not the full funnel) rather than repeating the same
investigation.
