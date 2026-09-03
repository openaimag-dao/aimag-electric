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
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes filterable on `/admin/quotes`, every submitted quote auto-links to a CRM Customer by phone/email match (creating a LEAD if none matches) and auto-assigns an owner via round-robin (least-loaded ADMIN/MANAGER) if the customer has none yet, surfaced on `/admin/quotes`. Phone matching now compares the last 10 digits (KZ/RU subscriber number) so `+7`/`8`/`7` prefixes and any spacing/dashes all link to the same customer, and email matching is case-insensitive — added this cycle.                   |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand logged into the same "top queries" / "no-result queries" admin widget. The narrower quote→order step of the conversion funnel is now tracked on the dashboard (real КП→заказ conversion rate, plus a direct "approved but not yet ordered" flag) — added this cycle; the fuller search→quote funnel remains untracked (no honest signal to build it on, per an earlier cycle's investigation).                                                                                                                                                    |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** Phase 9's
phone-normalization gap — `linkCustomerForQuote` matched phone/email as
exact strings, so `+7 701 234 56 78`, `8 701 234 56 78`, and
`87012345678` (the same real subscriber) wouldn't link to the same
customer. Needed one concrete normalization decision before
implementing.

**Decision:** compare the last 10 digits of the digit-stripped number
rather than a specific E.164/prefix-folding scheme. KZ/RU numbers are
written with a country/trunk prefix (`+7`, `8`, or bare `7`) followed by
a 10-digit subscriber number; comparing only the last 10 digits matches
regardless of which prefix convention or spacing/dashes was used,
without having to special-case which prefix means what.

**Fix shipped:**

- `src/lib/phone.ts` (new): `normalizePhone()` strips non-digits and
  returns the last 10, or `null` when there aren't enough digits to be
  a real number (avoids false positives on short/garbage input).
- `crm-service.ts`: `linkCustomerForQuote` now matches phone via a raw
  SQL query comparing `right(regexp_replace(phone, '\D', '', 'g'), 10)`
  against the normalized input (no schema change — the `Customer` table
  is small enough that a full-table function scan is fine; a persisted
  normalized column would be premature for current volume). Email
  matching is now case-insensitive (`mode: "insensitive"`) and lookup
  falls back to email only when phone doesn't match.
- 4 new unit tests for `normalizePhone` (prefix folding, spacing/dashes,
  too-short input, last-10-digit extraction).

Verified: typecheck clean, lint has only the same pre-existing warnings,
55/55 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: current/amperage diffing needs a real `Attribute` + seeded values first — a data decision, not scoped as engineering work. Dimension diffing for non-cable, non-`armatura-sip` categories still has no signal source.
- Phase 9: phone/email matching is still not fuzzy — a customer who changed company but kept the same number links to their old record. Considered the literal trade-off of matching on contact details rather than a stronger identity signal this app doesn't have; not attempting fuzzy matching without one.
- Phase 11: the fuller funnel (search → quote, not just quote → order) is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

No single obvious next item stands out. Re-read the Phase status table
for the next well-scoped candidate — Phase 4's dimension-diffing gap for
non-cable categories, or a fresh pass over Phase 2/3/7's admin UX for a
concrete rough edge, are the most likely next sources.
