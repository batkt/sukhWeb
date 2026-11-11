# sukhWeb/sukhBackv2 — System Knowledge Base

> **Scope note (read first):** the full 20-file deep template requested for this task
> (`01_SYSTEM_OVERVIEW.md` … `20_SYSTEM_GLOSSARY.md`, function-by-function for the entire
> system, DB schema, every API endpoint, full mermaid diagram set, security+performance audit)
> would require reading essentially all of `sukhWeb` + `sukhBackv2` + 3 dependency libraries
> line-by-line. That is realistically many hours of work; this pass had a small budget, shared
> across 31 repos in the wider "бүх систем дээр" task. Rather than produce 20 thin,
> partially-fabricated files, this pass went **deep on one real flow, verified against actual
> code**, and documents honestly what is *not* covered yet.

## What's here

| File | Covers | Depth |
|---|---|---|
| [05_FUNCTION_CATALOG.md](./05_FUNCTION_CATALOG.md) | Contract (`geree`) creation → initial invoice → ledger balance (`uldegdelBodyo`) → payment allocation (`syncInvoicesStatus`) | **Verified against code** (file+line read) |
| [06_FUNCTION_DEPENDENCIES.md](./06_FUNCTION_DEPENDENCIES.md) | Call graph + mermaid for the same flow, frontend → backend → DB | **Verified against code** |
| [17_GAPS_AND_RISKS.md](./17_GAPS_AND_RISKS.md) | Concrete bugs/risks found while tracing the flow above, plus "what Claude needs next time to move fast and safely" | **Verified** (each item cites file:line) |

## What's explicitly NOT covered (marked UNKNOWN, not guessed)

- Every other domain module in `sukhBackv2/routes/` (parking/`zogsool`, wallet/`walletRoute`,
  QPay/`qpayRoute`, ebarimt, residents/`orshinSuugchRoute`, notifications, etc.) — only
  module-level info exists, in `sukhBackv2/docs/API.md` (from the earlier pass in this same
  task). No function-level catalog for these yet.
- Database schema/index inventory (section 5/7 of the requested template) — not done.
- Mermaid ER diagram, full API-flow/auth-flow diagrams for the whole system — not done; only
  the one flow in `06_FUNCTION_DEPENDENCIES.md`.
- Security/performance audit across the codebase — not done; only the specific risks noted in
  `17_GAPS_AND_RISKS.md` that were visible while reading the ledger flow.
- Frontend component/page catalog beyond `useGeree.tsx` — not done.

## If you (a future Claude session, or a human) continue this

Pick the next-highest-value flow and repeat the same depth-over-breadth approach:
1. Payment/wallet flow (`walletRoute.js`, `qpayRoute.js`, `services/guilgeeService.js`'s other
   entry points) — highest risk because it's real money (QPay) and the ledger-sync duplication
   risk documented in `17_GAPS_AND_RISKS.md` likely also touches this path.
2. Parking (`parkingRoute.js`/`zogsoolRoute.js` + `sukhParkingV1`) — largest single route file
   (24 custom endpoints) with no function catalog yet.
3. Auth/permissions (`ajiltanRoute.js` + `zevbackv2`'s `tokenShalgakh`) — security-sensitive,
   shared across the whole product family, not yet traced function-by-function here.

Do not try to do all three (plus the rest of the system) in one pass — that's what produced an
unverifiable, budget-blowing scope the first time this task ran. One flow, fully verified, is
worth more than twenty flows guessed at.

---
_Generated 2026-11-10, third pass of the "бүх систем дээр" documentation task. Supersedes
nothing — adds to `docs/ARCHITECTURE.md` (repo/ecosystem overview, written in an earlier pass)._
