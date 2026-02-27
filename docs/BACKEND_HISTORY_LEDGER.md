# Backend: History Ledger with Running Balance (Үлдэгдэл)

The frontend **History** modal (contract/resident ledger) calls your API to get the full ledger with **backend-calculated running balance** instead of computing it in the browser. Implement the following endpoint on your backend (e.g. amarhome.mn API).

---

## Endpoint

| Method  | Path                                | Description                                                                                           |
| ------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **GET** | `/geree/:gereeniiId/history-ledger` | Returns the history ledger for one contract with `uldegdel` (running balance) computed on the server. |

---

## Request

### Path parameter

| Name         | Type   | Description                                                                      |
| ------------ | ------ | -------------------------------------------------------------------------------- |
| `gereeniiId` | string | Contract ID — same as `contract.gereeniiId` or `contract._id` from the frontend. |

### Query parameters

| Name              | Type           | Required | Description                    |
| ----------------- | -------------- | -------- | ------------------------------ |
| `baiguullagiinId` | string         | Yes      | Organization ID.               |
| `barilgiinId`     | string \| null | No       | Building ID (optional filter). |
| `_t`              | number         | No       | Cache-buster; can be ignored.  |

### Headers

- **Authorization:** `Bearer <token>` — same JWT the frontend uses for other API calls.

---

## Response shape

The frontend accepts any of these response bodies:

1. **`{ jagsaalt: LedgerRow[] }`** (preferred)
2. **`{ ledger: LedgerRow[] }`**
3. **`LedgerRow[]`** (root array)

Return the ledger in **chronological order (oldest first)**. The frontend reverses it for “newest first” display.

### LedgerRow (each item)

| Field              | Type    | Required    | Description                                                                          |
| ------------------ | ------- | ----------- | ------------------------------------------------------------------------------------ |
| `uldegdel`         | number  | **Yes**     | Running balance **after** this row. Must be computed on the backend.                 |
| `ognoo`            | string  | Yes         | Date (ISO or YYYY-MM-DD).                                                            |
| `ner`              | string  | Yes         | Row label (e.g. "Хог", "Эхний үлдэгдэл", "Төлбөр").                                  |
| `tulukhDun`        | number  | Yes         | Charge amount for this row (0 if none).                                              |
| `tulsunDun`        | number  | Yes         | Payment amount for this row (0 if none).                                             |
| `isSystem`         | boolean | Yes         | Whether the row is system-generated.                                                 |
| `_id`              | string  | Recommended | Unique id (for delete/keys).                                                         |
| `ajiltan`          | string  | No          | Employee name.                                                                       |
| `khelber`          | string  | No          | Payment/form type.                                                                   |
| `tailbar`          | string  | No          | Note/description.                                                                    |
| `burtgesenOgnoo`   | string  | No          | Registered date (ISO).                                                               |
| `parentInvoiceId`  | string  | No          | Parent invoice id if this is a sub-item.                                             |
| `sourceCollection` | string  | No          | One of: `"nekhemjlekhiinTuukh"`, `"gereeniiTulsunAvlaga"`, `"gereeniiTulukhAvlaga"`. |

**Important:** If the response has no rows or no row has a finite `uldegdel`, the frontend falls back to building the ledger from existing endpoints and computing balance in the browser. So at least one row must have a numeric `uldegdel` for the “backend path” to be used.

---

## Running balance (Үлдэгдэл) calculation

Compute **one** running balance in chronological order (oldest first):

1. Sort all ledger rows by date (and optionally by creation time within the same day).
2. Start with `runningBalance = 0`.
3. For each row in order:
   - `charge = row.tulukhDun ?? 0`
   - `pay = row.tulsunDun ?? 0`
   - `runningBalance = runningBalance + charge - pay`
   - Set `row.uldegdel = runningBalance`.

**Formula:** `uldegdel` = cumulative charges minus cumulative payments up to and including that row.

- Positive `uldegdel` = debt.
- Negative `uldegdel` = overpayment (credit).
- Zero = fully paid at that point.

---

## Where to get the ledger rows

The frontend currently builds the same list from these sources (filtered by the given contract / `gereeniiId`):

1. **Invoices** — e.g. from your existing **nekhemjlekhiinTuukh** (or equivalent) list for the org/building, filtered by `gereeniiId` (and optionally orshinSuugchId, gereeniiDugaar, ovog, ner, utas). From each invoice you expand:
   - **Zardluud** (charges): one row per line (ner, tariff/dun, tailbar, etc.) with `tulukhDun` set and `tulsunDun = 0`.
   - **Guilgeenuud** (e.g. payments): one row per item with `tulsunDun` set and appropriate `tulukhDun` (often 0).
2. **Payments** — from **gereeniiTulsunAvlaga** (or equivalent), filtered by the same contract. Each record typically gives a row with `tulsunDun` and optionally `tulukhDun`.
3. **Receivables / adjustments** — from **gereeniiTulukhAvlaga** (or equivalent), filtered by the same contract (e.g. Эхний үлдэгдэл, авлага). Each record gives a row with `tulukhDun` (and possibly `tulsunDun`).

You can reuse your existing logic that:

- Fetches or queries these three sources for the given `baiguullagiinId` and `barilgiinId`,
- Filters by `gereeniiId` (and any other contract identifiers you use),
- Flattens them into a single list of “ledger rows” with `ognoo`, `ner`, `tulukhDun`, `tulsunDun`, and any of the optional fields above.

Then sort that list by date (oldest first), run the running-balance loop above, and return the array (or `{ jagsaalt: [...] }` / `{ ledger: [...] }`).

---

## Example response (minimal)

```json
{
  "jagsaalt": [
    {
      "_id": "row-1",
      "ognoo": "2025-01-15",
      "ner": "Эхний үлдэгдэл",
      "tulukhDun": 50000,
      "tulsunDun": 0,
      "uldegdel": 50000,
      "isSystem": false,
      "sourceCollection": "gereeniiTulukhAvlaga"
    },
    {
      "_id": "row-2",
      "ognoo": "2025-02-01",
      "ner": "Төлбөр - 2-р сар",
      "tulukhDun": 120000,
      "tulsunDun": 0,
      "uldegdel": 170000,
      "isSystem": true,
      "sourceCollection": "nekhemjlekhiinTuukh"
    },
    {
      "_id": "row-3",
      "ognoo": "2025-02-10",
      "ner": "Бэлиг",
      "tulukhDun": 0,
      "tulsunDun": 50000,
      "uldegdel": 120000,
      "isSystem": false,
      "khelber": "Бэлиг",
      "sourceCollection": "gereeniiTulsunAvlaga"
    }
  ]
}
```

---

## Summary checklist

- [ ] **GET** `/geree/:gereeniiId/history-ledger` with query `baiguullagiinId`, optional `barilgiinId`.
- [ ] Auth: require **Bearer** token and resolve user/org as in other geree endpoints.
- [ ] Build ledger from invoices + payments + receivables for that contract; sort by date **oldest first**.
- [ ] Compute **uldegdel** per row with the running balance formula.
- [ ] Return `{ jagsaalt: LedgerRow[] }` (or `{ ledger: LedgerRow[] }` or raw array) with at least one row having a numeric `uldegdel`.

Once this is implemented, the History modal will use your backend-calculated Үлдэгдэл and will no longer compute it on the frontend for that contract.
