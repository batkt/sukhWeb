# Amar Sukh Ecosystem

One product line (СӨХ / condo + parking management, Mongolian market), several repos. Read this before exploring — it replaces re-deriving the cross-repo picture from scratch each session. Written to mirror the pattern used in `turees/docs/ECOSYSTEM.md` for the Turees/Rently product line.

## Product

"Amar Sukh" — condo owners' association (СӨХ) and parking management platform. Mongolian is the business language throughout (routes, models, hooks, DB fields).

## Repos

| Repo | Role | Stack | Git |
|---|---|---|---|
| **sukhWeb** (this repo) | Frontend admin | Next.js 15 (App Router), React 19, TS, antd 5 + Mantine, Tailwind | `D:/Work/sukhWeb` |
| sukhBackv2 | REST API backend | Express 5, Mongoose, Redis, PM2 | `D:/Work/sukhBackv2` |
| sukhParkingV1 | Parking domain library (peer dep of sukhBackv2) | TypeScript, Mongoose models | `D:/Work/sukhParkingV1` |
| quickqpaypackvSukh | QPay payment wrapper, Amar-Sukh-specific | TypeScript | `D:/Work/quickqpaypackvSukh` |
| zevbackv2 | Shared multi-tenant backend framework (used by sukhBackv2 and most of the product family) | TypeScript | `D:/Work/zevbackv2` |

## How they connect

- sukhWeb calls sukhBackv2's REST API via `src/lib/uilchilgee.ts` (axios layer) and `src/lib/endpoints.ts` (route constants); JWT bearer auth via `src/lib/auth.tsx`/`useAuth.tsx`.
- sukhBackv2 is built on `zevbackv2`: one master Mongoose connection (`erunkhiiKholbolt`) + one per-organization connection (`db.kholboltuud`, keyed by `baiguullagiinId`). `tokenShalgakh` middleware resolves/injects the per-request connection. Models are factory functions `(conn) => conn.kholbolt.model(...)`. `crud(router, "<model>", Model, UstsanBarimt)` auto-generates generic REST CRUD per model — see `docs/API.md` in sukhBackv2 for the module map.
- sukhBackv2 depends on `sukhParkingV1` (parking vehicles/fees/violations — peer dep on `zevbackv2`) and `quickqpaypackvSukh` (QPay invoice/customer linkage) as `node_modules` packages resolved from a local Verdaccio registry, not public npm.
- `src/context/BuildingContext` on the frontend mirrors the `barilgiinId` (building) scoping cookie pattern shared with the rest of the zevtabs product family (`turees`, `irtsWeb`).

## Domain glossary (Mongolian → English)

| MN term | English | | MN term | English |
|---|---|---|---|---|
| sukh / СӨХ | condo owners' association | | zogsool | parking |
| geree | contract / lease | | khariltsagch | client / tenant |
| orshin suugch | resident | | ajiltan | employee |
| tulbur | payment | | nekhemjlekh | invoice |
| ebarimt | e-receipt (tax e-invoice) | | tailan | report |
| tokhirgoo | settings/config | | medegdel | notification |
| niitlel | post / article | | tuukh | history |
| baiguullaga | organization | | | |

## Conventions / gotchas

- `npm run build` in sukhWeb runs `deploy/build.js` (safe temp-dir swap), **not** raw `next build` — see root `CLAUDE.md`, do not "simplify" this away.
- Business identifiers (routes, models, fields) are Mongolian — keep in lockstep across sukhWeb ↔ sukhBackv2 when changing a shared contract.
- `sukhBackv2`'s `scratch/` folder holds one-off production data-repair scripts — historical, not application code; destructive ones (`delete_*`, `void_*`, etc.) require explicit approval to run.
- No automated test suite in sukhWeb or sukhBackv2 — verify manually (`npm run dev` + exercise the page; for backend, read `scripts/e2e.js` before running, it hits real-ish flows).

## Where things live

- **sukhWeb**: `src/app/(shell)/` (authenticated admin pages), `src/lib/use*.tsx` (SWR data hooks), `src/lib/uilchilgee.ts` (API layer), `src/context/` (Building/Socket/Search/Spinner/Tour providers).
- **sukhBackv2**: `routes/` (one file per domain area), `controller/`, `services/` (invoicing pipeline, transactions, wallet, SMS, audit), `models/` (factory-function Mongoose schemas), `middleware/` (audit, cache, request timing).
- **sukhParkingV1**: `src/model/` (vehicles, fees, pricing, violations), `src/serivice/` (sic — kept as-is) (vehicle + parking-lot logic).
- **quickqpaypackvSukh**: `src/model/qpayKhariltsagch.ts`, `src/model/qpayObject.ts`, `src/service.ts` (QPay API client).

## Before starting work

1. A task touching a field/behavior shared between frontend and backend needs both `sukhWeb` and `sukhBackv2` checked.
2. Check `docs/BACKEND_HISTORY_LEDGER.md` in sukhBackv2 before assuming a backend field/behavior is new or unexplained.
3. Do not call real QPay/ebarimt/SMS endpoints in tests — `quickqpaypackvSukh` and sukhBackv2's qpay/ebarimt routes talk to live external services.

---
_Generated 2026-11-10 as part of a cross-system documentation pass (see "бүх систем дээр" task). Update when adding a repo, changing an API base URL, or introducing a new domain term._
