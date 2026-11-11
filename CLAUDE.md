# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**sukhWeb** (`package.json` name `sukhfront`) is the Next.js frontend for "Amar Sukh" — a condo/apartment (СӨХ) and parking management platform for the Mongolian market. Route names, model names, and business terms are Mongolian words; UI should support this domain vocabulary as-is (see Domain glossary below).

### Repo ecosystem

This repo talks to a sibling backend. A task may require editing both:

| Repo | Role | Stack |
|---|---|---|
| **sukhWeb** (this repo) | Frontend | Next.js 15 (App Router), React 19, TypeScript, antd 5 + Mantine, Tailwind |
| `sukhBackv2` (`D:\Work\sukhBackv2`) | REST API backend | Express 5, Mongoose, Redis, PM2 |

The backend depends on several private, unpublished-to-npm-public packages resolved from a local Verdaccio registry (`zevbackv2`, `sukhParking-v1`, `quickqpaypackvSukh`, `quickqpaypackv2`, `zuragpack`) — when backend behavior is unclear, read their source in `sukhBackv2/node_modules/<package>` rather than guessing.

## Commands

```
npm run dev          # next dev --turbopack
npm run build        # node deploy/build.js  — see "Build process" below, NOT a raw `next build`
npm run build:shuud   # next build directly (old behavior, skips the safe-swap)
npm run start         # next start
npm run lint          # eslint
```

There is no test script/suite in this repo — verify changes by running `npm run dev` and exercising the affected page.

### Build process (important — do not "simplify")

`npm run build` runs `deploy/build.js`, not `next build` directly. This exists because `next build` writes to `.next`, the same directory `next start` serves from — building while the site is live would delete chunks/CSS out from under the running process mid-request (symptom: page loads with no CSS/JS, stuck on a loading screen). The script builds into a temp dir (`.next.build`), and only on success swaps it with `.next` (previous build preserved as `.next.khuuchin`). It does **not** restart PM2 — that's a separate, deliberate step after deploying the swapped build. Keep this safe-swap behavior if you ever touch the build/deploy pipeline; `deploy/shinechlelt-front.sh` is the server-side script that drives it in production.

## Architecture

### Folder map

- `src/app/` — Next.js App Router. `src/app/(shell)/` is the authenticated admin area: `geree` (contracts), `zogsool` (parking), `tailan` (reports), `tulbur` (payments), `tokhirgoo` (settings), `medegdel` (notifications), `niitlel` (posts/blog), `tuukh` (history), `camera`. `src/app/login`, `/nevtrekh`, `/signup`, `/pay`, `/zogsool-qr` are unauthenticated/public entry points. `src/app/api/` holds Next.js route handlers (BFF-style endpoints), separate from calls that go straight to `sukhBackv2`.
- `components/shell/` — app chrome (AppShell, Sidebar, Topbar, notifications panel, help/settings modals) shared across `(shell)` pages.
- `src/lib/` — the bulk of business logic as hooks + plain functions: `use*.tsx` (SWR data hooks per domain model — `useGeree`, `useKhariltsagch`, `useBaiguullaga`, `useAjiltan`, `useTailan`, ...), `uilchilgee.ts` (API/axios layer), `auth.tsx`/`useAuth.tsx` (session), `permissions.ts`/`permissionUtils.ts` (access control), `endpoints.ts` (backend route constants). Favor extending an existing `use*` hook over writing a new fetch call inline in a component.
- `src/context/` — React context providers: `BuildingContext` (active барилга/building, mirrors the `barilgiinId` scoping pattern used across the zevtabs product family), `SocketContext` (realtime), `SearchContext`, `SpinnerContext`, `TourContext`.
- `src/tools/function/` — formatters and business calculations, same role as `tools/function/` in the `turees`/`irtsWeb` sibling frontends.
- `deploy/` — production build/deploy scripts (see above); not app code.
- `docs/BACKEND_HISTORY_LEDGER.md` — backend change history; check before assuming a backend field/behavior is new or unexplained.

### Conventions shared with the rest of the zevtabs product family

This codebase follows the same conventions as the other Next.js apps in this product family (`turees`, `tureesShine`, `irtsWeb`): Mongolian domain naming for routes/models/hooks, antd component wrapping rather than raw usage where a `components/ui`-style wrapper exists, SWR for data fetching, and a per-building/per-organization scoping cookie pattern. If a change spans both `sukhWeb` and `sukhBackv2`, check call sites in both before altering a shared contract.

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
| khariltsagch | client | | baiguullaga | organization |

## Notes

- `SKILL.MD` in the repo root is an unrelated Codex image-to-code design skill, not project documentation — ignore it when orienting to this codebase's architecture.
- This repo had uncommitted local changes at the time this file was written — do not assume `git status` is clean, and do not revert/discard existing working-tree changes.
