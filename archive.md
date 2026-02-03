# Database Archiving & Multi-Collection Logic

This document explains the "Split Table" architecture used to handle large-scale vehicle transaction data while maintaining high performance.

## 1. Why Archiving is Necessary
Vehicle parking systems generate thousands of records every day. If all history were stored in a single database table (collection), searches and reports would become extremely slow over time. To prevent this, the system automatically "splits" data into monthly archives.

---

## 2. The Naming Convention
Data is stored in MongoDB collections named based on the month and year of the transaction:

*   **`Uilchluulegch`**: The "live" collection containing the current month's data.
*   **`Uilchluulegch202312`**: Archive for December 2023.
*   **`Uilchluulegch202401`**: Archive for January 2024.
*   **`Uilchluulegch202402`**: Archive for February 2024.

---

## 3. Automatic Detection (`useUilchluulegch`)
The `useUilchluulegch` hook bridges the gap between the UI and these multiple collections. You do not need to manually specify which table to search; the hook calculates it for you.

### How it works:
1.  **Date Analysis**: The hook looks at the `createdAt` or `ognoo` range provided in your filter.
2.  **Current Month Check**: If the date range is within the current calendar month, it fetches from the standard `Uilchluulegch` table.
3.  **Archive Identification**: If the range is in the past (e.g., Nov 2023), it automatically generates an `archiveName` parameter (e.g., `Uilchluulegch202311`).
4.  **API Injection**: The `archiveName` is added to the API request. The backend sees this parameter and knows exactly which MongoDB collection to query.

---

## 4. Multi-Month Queries
If a user selects a date range that spans across multiple months (e.g., Jan 15th to Feb 15th):
*   The hook detects this and sets `archiveName` to **`multi-month`**.
*   The backend then performs a specialized query across all relevant archive collections and merges the results.
*   **Performance Note**: Multi-month queries are significantly slower than single-month queries. It is recommended to filter by a specific month whenever possible.

---

## 5. Common Issue: "No Data Found"
If you search for a specific license plate from 3 months ago and get **zero results**, check the following:

1.  **Date Range**: Ensure your date filter (`ognoo`) actually includes the month that the car was in the parking lot.
2.  **Archive Existence**: The system only creates archive tables if there was actually data for that month.
3.  **The Hook Parameter**: In the code, ensure the `query` object passed to `useUilchluulegch` contains a valid `$gte` and `$lte` date range. Without these, the hook defaults to the current month only.

```javascript
// Example of a query that triggers archiving:
const query = {
  createdAt: {
    $gte: "2023-11-01T00:00:00.000Z",
    $lte: "2023-11-30T23:59:59.000Z"
  }
};
// Result: archiveName = "Uilchluulegch202311"
```

---

## 6. Summary for Developers
*   **Logic Location**: `hooks/useUilchluulegch.js`
*   **Variable**: `queryWithArchive` (useMemo block)
*   **Backend Support**: The API endpoint `/zogsoolUilchluulegch` is programmed to read the `archiveName` string and switch database models dynamically.

