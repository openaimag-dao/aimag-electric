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
| 9   | CRM & Automation               | **Mostly complete**         | Customers/deals/activities, quote-status notifications to staff, audit trail, review-flagged quotes filterable on `/admin/quotes`, and — added this cycle, per explicit user direction — every submitted quote now auto-links to a CRM Customer by exact phone/email match (creating a LEAD if none matches) and auto-assigns an owner via round-robin (least-loaded ADMIN/MANAGER) if the customer has none yet, surfaced on `/admin/quotes`.                                                                                                                                                                      |
| 10  | Marketplace / Supplier Network | **Not started (by design)** | Long-term phase; correctly deferred until real order volume + supplier data exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand now logged into the same "top queries" / "no-result queries" admin widget — catalog-page logging added this cycle. Quote/order conversion funnels still untracked.                                                                                                                                                                                                                                                                                                                                                                                |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** Phase 9's
lead-assignment question. Last cycle investigated and found the
plumbing (`Customer.ownerId`) already exists but nothing ever linked an
incoming `Quote` to a `Customer`, and stopped to ask the user rather
than guess at the product decision. The user answered directly: yes,
auto-link by phone/email, and auto-assign round-robin.

**Fix shipped:**

- `crm-service.ts`: new `linkCustomerForQuote()` — looks up an existing
  `Customer` by exact `phone` or `email` match; creates a new `LEAD`
  Customer when neither matches. Exact string match only, no phone-format
  normalization or fuzzy dedup — documented as the explicit trade-off of
  matching on contact details with no stronger identity signal available
  (a customer who changed company but kept the same number links to
  their old record). Never reassigns an owner an existing customer
  already has.
- `crm-service.ts`: new `nextRoundRobinOwner()` — picks the ADMIN/MANAGER
  currently owning the fewest customers (ties broken by account age).
  This is a self-balancing rotation, not a literal A→B→C→A cursor: it
  needs no separate counter/cursor state, self-corrects for existing
  manual assignments, and stays correct if staff are added/removed —
  judged the more robust reading of "round-robin" for this use case.
- `quote-actions.ts`: `submitQuote` now calls `linkCustomerForQuote` for
  every quote (item-based or message-only — both always carry
  company/name/phone) and connects the resulting Customer to the Quote.
  Wrapped in its own try/catch: a linking failure is logged but never
  blocks the quote itself from submitting — this is enrichment, not the
  core action.
- `quote-admin-repository.ts`/`/admin/quotes`: the linked customer and
  assigned owner are now surfaced — a "→ manager name" line under the
  contact in the quotes table, and a "Клиент в CRM" link (to the
  customer's card, showing the assigned manager) in the quote detail
  view. Without this the auto-linking would be invisible plumbing staff
  couldn't act on.

Verified: typecheck clean, lint has only the same pre-existing warnings,
51/51 tests pass, production build succeeds. No new tests — same
reasoning as recent cycles (`crm-service.ts` is DB-backed with no
existing test coverage to extend, consistent with the rest of the
service layer); verified by reading the resulting logic and every call
site instead.

## Known issues / deferred

- Phase 4: current/amperage diffing needs a real `Attribute` + seeded values first — a data decision, not scoped as engineering work. Dimension diffing for non-cable, non-`armatura-sip` categories still has no signal source.
- Phase 9 (smaller, found this cycle): `linkCustomerForQuote`'s phone/email match is exact-string only — no normalization (spacing, `+7` vs `8` prefix, etc.), so two formats of the same real number won't link to the same customer. Not fixed now since normalizing phone numbers correctly needs a real format decision (E.164? Kazakhstan-specific?) rather than a guessed regex.
- Phase 11: quote/order conversion funnel is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

Re-read the Phase status table for the next "Partial"/"Mostly complete"
gap. Phase 11's conversion-funnel tracking is the least-explored
remaining item, though an earlier cycle already found no cheap honest
signal to build it on — worth a fresh look with a specific narrower
question (e.g. just quote→order, not the full funnel) rather than
repeating the same investigation. The phone-normalization gap noted
above (Known issues) is a smaller alternative if that's too large.
