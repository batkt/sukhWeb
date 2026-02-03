# Tuluv (Status) Control Documentation

This document explains how the `tuluv` (status) field works within the vehicle tracking and parking management system.

## 1. Status Values and Meanings

The `tuluv` field represents the current state of a vehicle's visit. It is typically found within the `tuukh` (history) array of a vehicle record.

| Value | Meaning | Description |
| :--- | :--- | :--- |
| **`0`** | **Active (Inside)** | The vehicle has entered but not yet exited. A duration timer is active for these records. |
| **`1`** | **Completed (Paid)** | The transaction is finished. Payment has been received, and the vehicle has been cleared to exit. |
| **`-2`** | **Error/Incomplete** | Used when the exit time is unknown or there was an issue tracking the vehicle's departure. |
| **`-4`** | **Debt/Unpaid** | The vehicle has a calculated amount due that hasn't been satisfied. |

---

## 2. Status Transitions and Logic

### Entry (Creation)
When a vehicle is registered (either via camera OCR or manual entry), the status is initialized to **`0`** (Active).

### Payment Process
In `components/pageComponents/tulbur/ShineTulbur.js`, once a payment is successfully processed:
*   The system calls the `/zogsooliinTulburTulye` endpoint.
*   The status is updated to **`1`** (Completed).
*   If the app is in **Offline Mode**, the status is updated locally via `updateOfflineItem` before being synced to the server later.

```javascript
// Example of status update in ShineTulbur.js (Offline Mode)
updateOfflineItem(uilchluugchiinId, (item) => ({
  ...item,
  tuukh: item.tuukh?.map((t, idx) =>
    idx === 0 ? { ...t, tuluv: 1, tulbur: yavuulakhTulbur } : t
  ),
}));
```

### Exit Logic
When a vehicle exits, the system checks the status. If `tuluv` is `1` (Paid) or the transaction is within the "Free Time" window, the gate is commanded to open.

---

## 3. Filtering by Status (tuluvFilter)

The system allows filtering the list of vehicles by their status. This is handled in `pages/khyanalt/zogsool/camera.js` through the `tuluvFilter` state.

*   **Active**: Queries records with `tuukh.0.tuluv: 0` AND no exit gate assigned.
*   **Paid (Tulsun)**: Queries records with `tuukh.0.tuluv: 1`.
*   **Unpaid (Tulburtei)**: Queries records with `tuukh.0.tuluv: -4` or where `niitDun > 0` and no payments exist.
*   **Free (Unegui)**: Queries records where `niitDun: 0`.

### UI Representation
In the table (`ZogsoolCameraTable`), the status is often color-coded:
- **Green/Blue**: Active or recently entered.
- **Red**: Debt or error status.
- **Success Icon**: Paid status.

---

## 4. Manual Overrides
Administrators can sometimes manually override the status (e.g., using "F7 Free" shortcut) which forces a specific payment record and updates the status to `1`.
