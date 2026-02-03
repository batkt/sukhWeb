# Filter and Pagination Logic Documentation

This document describes the implementation of filters, sorting, and pagination within the **Camera Control Page** (`pages/khyanalt/zogsool/camera.js`).

## 1. Filters & Sorting Logic

The application uses a combination of client-side state and MongoDB queries to filter and sort the vehicle list. The core logic is built around the `useUilchluulegch` hook, which reacts to changes in `query` and `order` states.

### "Duration/min" (Хугацаа/мин) - Sorting
The element labeled **"Хугацаа/мин"** in the table header acts primarily as a **Sorter**, not a strict filter.

*   **Location**: It is located in the header of the "Duration" column.
*   **Mechanism**: It uses a `Popover` containing three clickable options that update the `order` state variable.
*   **Options**:
    1.  **Longest Duration First** (Удаан зогссон эхэнд):
        *   Sets `order` to `{ "tuukh.0.niitKhugatsaa": -1 }`.
        *   Sorts by the calculated total duration descending.
    2.  **Latest Entry First** (Сүүлд орсон эхэнд):
        *   Sets `order` to `{ "tuukh.tsagiinTuukh.garsanTsag": 1, niitDun: 1, ... }`.
        *   Complex sort prioritizing recent entries and specific statuses.
    3.  **Latest Exit First** (Сүүлд гарсан эхэнд):
        *   Sets `order` to `{ "tuukh.0.tsagiinTuukh.0.garsanTsag": -1 }`.
        *   Sorts by exit time descending.

### Other Filters
The `query` object passed to the API is constructed dynamically (lines 482-593 in `camera.js`) based on several state variables:

1.  **Search (`khaikh`)**:
    *   **Logic**: Performs a regex search (`$regex`) on `mashiniiDugaar` (License Plate).
    *   **Trigger**: Updates whenever the search input changes.

2.  **Status (`tuluvFilter`)**:
    *   **Logic**: A `switch` statement handles distinct statuses:
        *   `active`: Currently inside (no exit time/gate).
        *   `tulsun`/`tulugdsun`: Paid/Completed.
        *   `unegui`: Free (Total amount = 0).
        *   `tulburtei`: Unpaid/Debt.
    *   **Reset Behavior**: Currently, this filter explicitly resets pagination to Page 1 when changed (see *Pagination* section).

3.  **Payment Type (`khelber`)**:
    *   **Logic**: Filters by payment method field (`tuukh.tulbur.turul`).
    *   **Special Case**: `khelber === 'card'` matches a list of banks (Khaan, TDB, etc.).

4.  **Amount (`dun`)**:
    *   **Logic**: Filters records where calculation is required (`dunBodson`).

5.  **Date Range (`ognoo`)**:
    *   **Logic**: Filters by `createdAt` or exit time within the selected start/end dates.

---

## 2. Pagination Reset Logic (Page 3 to Page 1)

**The Problem:**
When a user is on **Page 3** and applies a new filter (e.g., changes sorting or searches), the `page` state (inside the hook) usually remains at `3`. If the filtered result has fewer than 3 pages of data, the user sees an empty table.

**The Solution:**
To correctly handle this "Page 3 -> Page 1" transition, we must explicitly reset the pagination state whenever a filter or sort order changes.

### Current Implementation Status
*   **Status Filter (`tuluvFilter`)**: **Already handled.**
    ```javascript
    useEffect(() => {
      if (tuluvFilter) {
        setUilchluulegchKhuudaslalt((prev) => ({
          ...prev,
          khuudasniiDugaar: 1, // Resets to Page 1
        }));
      }
    }, [tuluvFilter]);
    ```

*   **Duration/Sorting (`order`)**: **Likely Missing.**
    If you change the "Duration" sort while on Page 3, it may stay on Page 3. Correct behavior requires adding a similar effect or updating the handler.

### Recommended Implementation
To ensure **all** filters (Sort, Search, Type) reset to Page 1, you should trigger the reset in their respective change handlers or a unified `useEffect`.

#### Method A: Unified Effect (Cleanest)
Add the `order`, `khaikh`, `khelber`, and `dun` dependencies to the reset logic.

```javascript
useEffect(() => {
  setUilchluulegchKhuudaslalt((prev) => ({
    ...prev,
    khuudasniiDugaar: 1,
  }));
}, [tuluvFilter, order, khelber, dun, khaikh]); // Add all filter states here
```

#### Method B: Inside Handlers
When the user clicks the sort button in the Popover, update the handler:

```javascript
// Example for "Longest Duration First" click handler
onClick={() => {
    setOrder({ "tuukh.0.niitKhugatsaa": -1 });
    // Add this line:
    setUilchluulegchKhuudaslalt(prev => ({ ...prev, khuudasniiDugaar: 1 }));
}}
```

### Summary of "Calling Data of Page 3 to Page 1"
1.  **State**: Pagination is held in `khuudaslalt.khuudasniiDugaar`.
2.  **Trigger**: User changes a filter (e.g., Sorts by Duration).
3.  **Action**: The state update function `setUilchluulegchKhuudaslalt` must be called to set `khuudasniiDugaar` to `1`.
4.  **Result**: The `useSWR` hook detects the state change and fetches the *first page* of the *newly filtered/sorted* data.
