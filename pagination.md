# Data Fetching and Pagination Guide

This document explains the architecture for retrieving data, how pagination is implemented, and how to access specific data across different pages in this application.

## 1. Core Data Fetching Mechanism

The application primarily uses **SWR (Stale-While-Revalidate)** for data fetching. This provides automatic caching, revalidation, and a smooth user experience.

### Main Hooks
1.  **`useJagsaalt`**: A generic hook used for list-based data (e.g., parking list, gates).
2.  **`useUilchluulegch`**: A specialized hook for vehicle transaction history (`/zogsoolUilchluulegch`).

### How Fetching Works:
*   **Request Library**: `axios` (wrapped in a `uilchilgee` service).
*   **Trigger**: Whenever the dependencies of the SWR key change (e.g., page number, filter query, or search string), a new request is automatically sent to the backend.
*   **Caching**: Data is cached in memory (SWR) and persisted in **IndexedDB** for offline use and instant loading.

---

## 2. Pagination Logic

Pagination is managed through a local state object within the hooks named `khuudaslalt`.

### State Structure
```javascript
const [khuudaslalt, setKhuudaslalt] = useState({
  khuudasniiDugaar: 1,      // Current Page Number
  khuudasniiKhemjee: 100,  // Results per Page
  search: "",              // Current Search term
  jagsaalt: [],            // Accumulated list (for infinite scroll)
});
```

### Resetting to Page 1
Whenever a **filter** or **search** is applied, you MUST reset `khuudasniiDugaar` to `1`. Otherwise, if you are on Page 5 and apply a search that only has 1 page of results, the UI will appear empty.

**Example Implementation:**
```javascript
function onSearch(searchUtga) {
  setKhuudaslalt(prev => ({
    ...prev,
    search: searchUtga,
    khuudasniiDugaar: 1, // Reset to start
    jagsaalt: []         // Clear existing data
  }));
}
```

---

## 3. Getting Data from "Any Page" in "Any Page"

There are three ways to access data globally or across different routes:

### A. Sharing the SWR Cache
If two different pages use the same SWR hook with the **exact same arguments** (URL, query, order), they will share the same data and loading state. Updating the data in one page (via `mutate`) will instantly update it in the other.

### B. Accessing the Persistent Cache (IndexedDB)
The hooks automatically save fetched data to IndexedDB. You can retrieve this data manually even if you are on a different page without making a network request.

**Tools used:** `utils/indexedDB.js`
*   `getCache(key)`: Retrieve a specific cached result.
*   `searchCacheByPrefix(prefix)`: Find data by a partial key (e.g., search for all data related to a specific building).

### C. Global State / Context
The `useAuth` hook provides global information like `baiguullaga` (Organization) and `ajiltan` (Employee) which is available everywhere in the app.

---

## 4. Practical Example: "Wanted Data"
If you are on **Page A** and need data that was fetched on **Page B**:
1.  **Check if the data exists in Cache**: Call the relevant hook with the parameters used on Page B. SWR will return the cached data immediately.
2.  **Programmatic Page Call**: To get data from a specific page (e.g., Page 3) regardless of where you are:
    ```javascript
    // Setting the hook to Page 3
    setUilchluulegchKhuudaslalt(prev => ({
      ...prev,
      khuudasniiDugaar: 3
    }));
    ```
3.  **Cross-Month Retrieval**: The `useUilchluulegch` hook has logic to automatically switch between standard tables and **Archive Tables** (e.g., `Uilchluulegch202401`) based on the date range provided in the query.
