# Gaps & Risks — Contract / Ledger / Invoice flow

Everything below was found by reading the actual code cited in `05_FUNCTION_CATALOG.md`, not
inferred from naming or assumed. Severity is my judgment, not measured impact — verify before
prioritizing.

## Concrete risks found (fix candidates)

### R1 — Silent invoice-creation failure on contract creation
- **File:** `sukhBackv2/controller/gereeController.js:408-423`
- **Evidence:** `createInvoiceForContract` is called inside `try { } catch (err) {
  console.error(...) }` with no re-throw, no response-field indicating partial failure. The
  route still returns `201` with the created `Geree`.
- **Impact:** a contract can exist in the UI with zero invoices and no visible error — a user
  looking at the new contract's ledger would see it as empty/paid rather than "invoice
  generation failed." Likely surfaces as a confusing support ticket, not a crash.
- **Fix direction:** at minimum, include a `warning` field in the response when invoice
  creation fails, so the frontend can surface it. Whether to make contract creation
  transactional with invoice creation is a bigger decision — flag to the user, don't decide
  unilaterally.

### R2 — Duplicate ledger-allocation logic (`uldegdelBodyo` vs `syncInvoicesStatus`)
- **Files:** `sukhBackv2/controller/gereeController.js:259-310` (F3) vs.
  `sukhBackv2/services/guilgeeService.js:216-337` (F5, canonical, 14 call sites elsewhere).
- **Evidence:** F3's own code comment at line 263 says it mirrors F5's rule by hand instead of
  calling it.
- **Impact:** any future change to payment-allocation/discount-matching rules (a near-certain
  future task, given it's core billing logic) must be made in **two places** to stay
  consistent, or the balance shown by F3's endpoint and the status written by F5 will diverge.
  This is exactly the kind of duplication that produces "why does the ledger show paid but the
  invoice says unpaid" bugs months later.
- **Fix direction:** refactor F3 to call F5 (or extract the shared rule into one function both
  call) — but this is a behavior-risk change to core billing math; do not do this without
  explicit approval and a way to verify against real contract data first (per the global
  production-safety rules in this workspace's CLAUDE.md files).

### R3 — Hardcoded organization ID in a billing formula
- **File:** `sukhBackv2/controller/gereeController.js:91`
- **Evidence:** `req.body.baiguullagiinId === "679aea9032299b7ba8462a77" ? 11520 : 15500` inside
  the capacity-fee (`chadalDun`) calculation in `zaaltOlnoorOruulya`.
- **Impact:** one specific organization gets different billing math than every other
  organization, with no comment explaining why, no config flag, and no name attached to the ID.
  If that organization's special-case requirement ever changes, or if the ID is misread/
  mistyped during a future edit, billing for that org silently breaks with no error.
- **Fix direction:** move this into `baiguullaga.tokhirgoo` as a named, documented config value.
  Needs a human who knows why this org is special — do not guess the business reason.

## What's missing for **fast, safe, high-quality** future work on this flow (the direct ask)

1. **No tests at all for billing math.** `uldegdelBodyo`, `syncInvoicesStatus`, and
   `khungulultNekhemjlekhendOnooyo` compute money. There is no automated way to confirm a
   refactor of R2 doesn't change a real contract's displayed balance. Before touching any of
   F1-F5, the highest-leverage investment is a handful of unit tests against recorded
   real-shaped ledger fixtures (anonymized), covering: normal payment, discount in the same
   month as its invoice, discount >45 days from any invoice (the F4 edge case), and a contract
   with two unpaid invoices (tests FIFO ordering).
2. **No structured logging for the billing path.** F2/F5 use `console.log`/`console.error`
   with emoji prefixes — fine for local debugging, but there's no request ID or contract ID
   consistently attached, so correlating a production billing complaint to a specific function
   run is harder than it needs to be.
3. **Unknown callers.** F3 (`uldegdelBodyo`) has no located frontend call site in `sukhWeb/src/
   lib/` — before changing its response shape, a full-repo grep (not just hooks) is required.
   Likewise, F2's cron-triggered call path (if any) was not located — check `sukhBackv2/
   index.js` for `node-cron` registrations before assuming invoices are only created from
   `createGeree` and `/syncInvoices`.
4. **No single source of truth for "why 45 days" and "why this org gets different constants."**
   Both are magic numbers with real business meaning that isn't written down anywhere in code
   or docs. Future changes to either will be guesses unless someone who knows the history
   writes it down once.
5. **No DB schema/index doc for `guilgeeAvlaguud`/`nekhemjlekhiinTuukh`** — this pass read
   query/write logic but not the Mongoose schemas or their indexes. Before adding a new query
   pattern against either collection (e.g. for a report), check `sukhBackv2/models/
   guilgeeAvlaguud.js` and `models/nekhemjlekhiinTuukh.js` for existing indexes — not done in
   this pass, genuinely unknown.
6. **This catalog covers one flow.** The payment/wallet/QPay path, parking, and auth/permission
   flows are undocumented at function level (see `INDEX.md`'s "not covered" list). Anyone
   picking up work in those areas should expect to do the same trace-and-document pass before
   relying on anything beyond the module-level `docs/API.md` map from the earlier pass.

## How to use this file

Treat it as a checklist, not a backlog commitment — nothing here has been fixed; this pass was
read-only analysis only, per this task's instructions. If you ask a future session to act on
R1/R2/R3, point it at this file and the specific file:line citations rather than re-deriving
them.
