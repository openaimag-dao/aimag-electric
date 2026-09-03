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
| 11  | Data Intelligence              | **Partial**                 | Both header-search and catalog-page (`/catalog?q=`) search demand logged into the same "top queries" / "no-result queries" admin widget. The narrower quote→order step of the conversion funnel is now tracked on the dashboard (real КП→заказ conversion rate, plus a direct "approved but not yet ordered" flag) — added this cycle; the fuller search→quote funnel remains untracked (no honest signal to build it on, per an earlier cycle's investigation).                                                                                                                                                    |
| 12  | AI Sales Agent                 | **Not started (by design)** | Depends on Phase 5 existing first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## This cycle's work

**Bottleneck (from last cycle's "next priority"):** Phase 11's
conversion-funnel tracking, narrowed to specifically quote→order rather
than the fuller funnel an earlier cycle already found no honest signal
for. Checked first whether the narrower step is actually trackable
without new infrastructure — it is: `Order.quoteId` (unique, optional)
already links every order back to its source quote, so "how many
quotes became orders" is a direct count against data that already
exists, not a new tracking mechanism.

**Fix shipped:**

- `admin-service.ts`: `dashboard()` now also counts `quotesWithOrder`
  (`Quote`s with a linked `Order`) and `quotesWonNoOrder` (`status:
WON` quotes with no linked `Order` yet — an approved quote no one has
  turned into an order, a concrete, actionable gap rather than a vague
  "funnel" number).
- `admin/page.tsx`: the existing "Заявки по статусам" dashboard panel
  now shows the real КП→заказ conversion rate underneath the status
  breakdown, and — only when the count is nonzero — a direct link
  flagging how many approved quotes still need an order created.

Verified: typecheck clean, lint has only the same pre-existing warnings,
51/51 tests pass, production build succeeds.

## Known issues / deferred

- Phase 4: current/amperage diffing needs a real `Attribute` + seeded values first — a data decision, not scoped as engineering work. Dimension diffing for non-cable, non-`armatura-sip` categories still has no signal source.
- Phase 9: `linkCustomerForQuote`'s phone/email match is exact-string only — no normalization (spacing, `+7` vs `8` prefix, etc.), so two formats of the same real number won't link to the same customer. Not fixed yet since normalizing phone numbers correctly needs a real format decision (E.164? Kazakhstan-specific?) rather than a guessed regex.
- Phase 11: the fuller funnel (search → quote, not just quote → order) is still untracked, and — per an earlier cycle's investigation — isn't cheaply trackable without new session infrastructure; not attempting a fake/partial version of it.

## Next priority

No single obvious next item stands out again. The phone-normalization
gap (Phase 9, Known issues above) is the smallest well-scoped remaining
item — needs one concrete decision (which normalization scheme: E.164?
strip-and-compare last N digits? Kazakhstan-specific 7/8-prefix
folding?) before implementing, otherwise re-read the Phase status table
for the next candidate.
