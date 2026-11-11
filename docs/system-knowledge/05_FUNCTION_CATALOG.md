# Function Catalog — Contract / Ledger / Invoice flow

Scope: the path from creating a `geree` (contract) through its first invoice, to how the
frontend reads a contract's running balance, to how payments get attributed back to invoices.
Every function below was opened and read (file:line cited); nothing here is guessed.

---

### F1 — `createGeree`
- **File:** `sukhBackv2/controller/gereeController.js:327-426`
- **Route:** `POST /geree` (`sukhBackv2/routes/gereeRoute.js:592`)
- **Purpose:** create a new contract document, seeding its cost-line items (`zardluud`) from
  the building's default `ashiglaltiinZardluud` (utility cost config) if none were supplied,
  then immediately create the contract's first invoice.
- **Input:** `req.body` — `baiguullagiinId`, `barilgiinId` (required, 400 if missing), rest of
  the contract fields (`ner`, `gereeniiDugaar`, `tootTurul`, optional `zardluud[]`, …).
- **Output:** `201` + the created `Geree` document.
- **DB collections touched:** `baiguullaga` (read, master DB), `ashiglaltiinZardluud` (read,
  org DB), `geree` (write, org DB — via `new GereeModel(contractData).save()`).
- **Calls:** `zardalAngilal.zardluudShuuye()` (filters cost lines by `tootTurul` — parking/
  storage contracts don't inherit residential utility cost lines), `invoiceService.
  createInvoiceForContract()` (F2).
- **Called by:** frontend `useGereeCRUD().gereeUusgekh()` (`sukhWeb/src/lib/useGeree.tsx:241-263`).
- **Error handling:** the call to `createInvoiceForContract` is wrapped in try/catch that only
  `console.error`s — **a contract can be created successfully with no initial invoice and no
  visible error to the caller or the UI.** See `17_GAPS_AND_RISKS.md` R1.
- **Auth:** behind `tokenShalgakh` (route-level) — any authenticated employee token for the org.
  No additional permission check in the controller itself.

### F2 — `createInvoiceForContract(kholbolt, gereeId, options)`
- **File:** `sukhBackv2/services/invoiceService.js:311+`
- **Purpose:** generate the first (or next) invoice for a contract.
- **Input:** `kholbolt` (org Mongoose connection), `gereeId`, `options` (`billingDate`,
  `forceEmpty`, `ajiltanId`, `ajiltanNer`).
- **DB:** reads `geree` via `GereeModel.collection.findOne` (raw collection access, not the
  Mongoose model — bypasses schema defaults/virtuals; confirm this is intentional before
  changing the schema), reads/writes `guilgeeAvlaguud` (the ledger line-item collection),
  writes `nekhemjlekhiinTuukh` (invoice history).
- **Called by:** F1 (on contract creation), and `POST /syncInvoices`
  (`sukhBackv2/routes/gereeRoute.js:524`, not traced further this pass), and presumably a
  monthly billing cron (**UNKNOWN** — not located in this pass; check `index.js`/`node-cron`
  registrations before assuming invoices only get created from these two call sites).
- **Logs:** uses `console.log`/`console.error` with emoji-prefixed messages, not a structured
  logger — fine for now but means these traces are easy to lose in production log volume.

### F3 — `uldegdelBodyo` (contract balance / ledger summary)
- **File:** `sukhBackv2/controller/gereeController.js:163-325`
- **Route:** `POST /uldegdelBodyo` (`sukhBackv2/routes/gereeRoute.js:99`)
- **Purpose:** compute a contract's (or building's) outstanding balance and per-invoice
  paid/unpaid status, for display (e.g. the contract detail page's ledger view).
- **Input:** `baiguullagiinId` (required), `barilgiinId`, `gereeniiId`, `ognoo` (2-element
  date range), `summaryOnly` (skip returning the raw line-item list — added, per the code
  comment at line 171-174, because fetching the full ledger per contract was slow for bulk
  monthly billing-sheet generation across many contracts).
- **Core logic (verified, lines 198-310):**
  1. Runs **two separate queries** against `guilgeeAvlaguud`: `query` (date-range-bounded, for
     the returned `items` list) and `summaryQuery` (only upper-bounded by the range's end date,
     for the running balance) — this split exists specifically to fix a prior bug where a
     single bounded query made old debt disappear from the balance (code comment lines 205-211).
  2. Groups line items by `nekhemjlekhId` into `invoiceCharges`, sums payments (`dun < 0`) into
     `availableFunds`.
  3. Calls F4 (`guilgeeService.khungulultNekhemjlekhendOnooyo`) to attribute discount lines to
     a specific invoice before FIFO-distributing the remaining payments.
  4. Sorts invoices oldest-first and FIFO-allocates `availableFunds` across them, writing the
     resulting `tuluv`/`uldegdel`/`niitTulbur` back onto each `nekhemjlekhiinTuukh` document
     (`updateOne`, silently swallows failure via `.catch(() => {})`).
- **This FIFO + discount-attribution logic is a parallel reimplementation of `syncInvoicesStatus`
  (F5)** — the code comment at line 263 explicitly says "ижил дүрэм" (same rule as
  `syncInvoicesStatus`). See `17_GAPS_AND_RISKS.md` R2 — this is the single highest-value thing
  to fix before doing further ledger work.
- **Called by:** **UNKNOWN from this pass** — no frontend hook named for this endpoint was
  located in `sukhWeb/src/lib/`; grep `uldegdelBodyo` in `sukhWeb` before changing this
  function's response shape, since something clearly calls it.

### F4 — `khungulultNekhemjlekhendOnooyo(ledger, invoices)`
- **File:** `sukhBackv2/services/guilgeeService.js:172-?` (function starts at 172; body
  continues past what was read this pass — read the rest before modifying).
- **Purpose:** attribute a discount (`khungulult`) ledger line to the invoice it belongs to,
  so FIFO payment distribution doesn't mis-credit a discount as general payment.
- **Matching rule (verified, lines 183-203):** exact `nekhemjlekhId` if present and valid →
  else same calendar month (`sarKey`) as an invoice for the same contract → else nearest invoice
  by date **only if within 45 days**; beyond 45 days, the discount is treated as unattributed
  and falls back into general `availableFunds`.
- **Why 45 days:** **UNKNOWN** — no comment explains the choice; treat as a magic number, not a
  documented business rule. Confirm with a human before relying on or changing it.
- **Called by:** F3 (`uldegdelBodyo`). Also referenced, per the duplication finding below, by
  the equivalent logic inside `syncInvoicesStatus` — **confirm whether F5 actually calls this
  same function or has its own copy** (not verified this pass — see Gaps file G1).

### F5 — `syncInvoicesStatus(kholbolt, gereeniiId)`
- **File:** `sukhBackv2/services/guilgeeService.js:216-337` (`exports.syncInvoicesStatus` at
  line 424).
- **Purpose:** the **canonical** ledger→invoice-status sync: described in its own doc-comment
  (lines 21, 33) as idempotent, derives invoice `tuluv`/`uldegdel` from the full ledger.
- **Called by:** automatically after ledger-affecting writes in this same file (lines 74, 150,
  368, behind a `deferSync` opt-out), and from `controller/tulbur.js:339` after recording a
  payment. **Not** called by F3 (`uldegdelBodyo`), which reimplements the same rule inline
  instead — this is the duplication flagged in R2.
- **14 files reference `syncInvoicesStatus`** (routes, controllers, and several one-off
  `scripts/*.js` data-repair tools) — this is the system's single most load-bearing billing
  function; treat any change to it as high blast-radius across invoicing, payments, and the
  historical data-repair scripts in `sukhBackv2/scripts/`.

### F6 — `useGereeJagsaalt` / `useGereeCRUD` (frontend)
- **File:** `sukhWeb/src/lib/useGeree.tsx:187-328`
- **Purpose:** SWR-backed contract list fetch (`useGereeJagsaalt`) + CRUD actions
  (`useGereeCRUD().gereeUusgekh/gereeZasakh/gereeUstgakh`), both thin wrappers over
  `uilchilgee(token)` axios calls to `/geree`.
- **Notable behavior (verified):** `fetcherJagsaalt` (lines 68-185) does its own client-side
  org/building filtering (lines 152-166) **in addition to** sending `baiguullagiinId`/
  `barilgiinId` as query params — i.e. it does not fully trust the backend to scope results
  correctly, and re-filters defensively. If you change backend scoping, this client-side filter
  will mask a backend bug rather than surface it — worth knowing before assuming an API change
  is "done" once the list renders correctly in the UI.
- SWR config explicitly disables caching/deduping (`dedupingInterval: 0`, `keepPreviousData:
  false`, comment at line 218-219) to avoid stale balances across incognito/normal sessions —
  i.e. every contract list render is a fresh network round-trip by design, not an oversight.
