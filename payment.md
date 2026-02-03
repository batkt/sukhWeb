# Payment Processing System Documentation

This document provides a comprehensive guide to the payment processing logic, hardware integrations, and transaction workflows within the application.

## 1. Core Component: `ShineTulbur.js`
The `ShineTulbur` component is the heart of the payment system. It handles multi-modal payments (Cash, Card, QR, Account Transfer, and Discounts).

### Transaction Lifecycle:
1.  **Initiation**: Triggered from the dashboard (often via **F4** shortcut). It receives the vehicle's `niitDun` (Total Amount) and `tuukh` (History).
2.  **Amount Calculation**:
    *   `turulruuKhiikhDun`: The amount currently being entered by the operator.
    *   `tulukhDun`: The net balance remaining (`Total - Already Paid - Discounts`).
3.  **Payment Method Selection**: The operator chooses a method (Cash, Khaan Bank, QPay, etc.) and enters the amount.
4.  **Submission (`zogsooliinTulburTulye`)**: Once the balance reaches zero, the data is sent to the backend.
5.  **Success Actions**: 
    - Gate opens automatically.
    - E-Barimt (Electronic Receipt) window opens (if enabled).

---

## 2. Payment Methods & Integrations

### A. Cash (`belen`)
- Simple entry. The system calculates change (khariult) if the entered amount exceeds the balance.

### B. Bank Terminal (`khaan`)
- **Integration**: Communicates with a local terminal service (typically `http://127.0.0.1:27028`).
- **Protocol**: Sends a JSON POST with `service_name: "doSaleTransaction"`.
- **Workflow**: The web app waits for the physical terminal to return a `response_code: "000"` before marking the payment as successful.

### C. QPay / Digital QR (`qpay`)
- **Process**: Requests a unique QR code from the backend.
- **Polling**: Uses **Socket.io** to listen for a `qpay/[baiguullagaId]/[orderId]` event. When the user pays via their mobile banking app, the socket triggers the `batalgaajuulaltKhiiya` function automatically.

### D. Discounts (`khungulult`)
- **Restriction**: Only available for authorized employees (`ajiltanKhungulultEsekh`).
- **Validation**: Requires a "Reason" (tailbar) for the discount to be recorded in the audit log.

---

## 3. E-Barimt (Electronic Receipt) Logic
The system integrates with the Mongolian taxation system (E-Barimt).

- **Types**:
    1.  **Individual (`1`)**: Requires no additional info.
    2.  **Organization (`3`)**: Requires the company's Register number.
- **Workflow**:
    - After payment, the user can choose "Print Receipt".
    - The system calls `/ebarimtShivye`.
    - Returns a JSON containing `lottery` number and `qrData`.
    - The `QRCode` component renders the scannable code for the customer.

---

## 4. Security & Validation
To prevent data mismatch, the system performs a final validation check before submission:
- **Total vs. Expected**: The sum of all payments must exactly match the total calculated fee.
- **Tolerance**: A small 1 MNT difference is allowed for rounding issues.
- **Audit Log**: Every payment includes the `burtgesenAjiltaniiId` and `ognoo` (Timestamp).

---

## 5. Hardware Automation (The "Gate Kick")
Upon successful payment:
- The system checks `songogdsonZogsool?.garakhKhaalgaGarTokhirgoo`.
- If automatic opening is enabled, it sends a command to the gate relay:
  ```javascript
  zogsoolUilchilgee().get("/neeye/" + camerVal)
  ```
- This ensures the driver can exit immediately after paying without the operator clicking another button.

