# F4 Payment Modal: Comprehensive User Guide

This guide provides full instructions on every feature, button, and data point within the **F4 Payment Modal** (`ShineTulbur.js`).

---

## 1. Visual Layout Overview
When the modal opens, it is divided into several functional zones:
- **Top Bar**: Displays the vehicle license plate and the "Close" button.
- **Payment Methods (Left)**: Icons for Cash, Card, Account Transfer, and Discounts.
- **Digital Payments (Center-Top)**: QPay and Toki QR integrations.
- **Quick Cash Buttons (Bottom-Left)**: Fast entry for 500, 1,000, 5,000, 10,000, and 20,000 MNT bills.
- **Numpad (Center)**: Large numeric buttons for custom amount entry.
- **Summary Panel (Right)**: Current balance, change calculation, and "Save" button.

---

## 2. Using the Payment Methods

### A. Cash (Бэлэн)
- **Manual**: Type the amount on the numpad and click **"Бэлэн"**.
- **Quick**: Click the banknote buttons (e.g., "20,000") and then click **"Бэлэн"**.
- **Shortcut**: Double-tapping **F4** automatically adds the full remaining balance as Cash.

### B. Bank Card (Карт/Кхан Банк) - [F3]
- Click **"Карт"** or press **F3**.
- This sends the amount to the physical bank terminal. 
- Wait for the "Amjilttai" message on the terminal before proceeding.

### C. QPay QR Code
- Click the **QPay** logo.
- A popup will show a QR code.
- The system will "wait" (via socket) for the user to scan and pay. Once paid, the modal will automatically move to the next step.

### D. Discounts (Хөнгөлөлт)
- Available only to authorized users. 
- You must enter a **Reason** (tailbar) before the discount can be applied.

---

## 3. Data Displays (The Summary Panel)
- **Нийт дүн (Total)**: The total amount calculated for the parking duration.
- **Дутуу (Due)**: Remaining amount the customer still needs to pay (shown in **Red**).
- **Хариулт (Change)**: If the customer gives more cash than the total, this shows the amount you need to return to them (shown in **Green**).

---

## 4. E-Barimt (Electronic Receipts)
After the payment is confirmed, the modal moves to Step 2: **Баримт**.
- **Individual (Иргэн)**: The default. Just click **"Хэвлэх"**.
- **Organization (Байгууллага)**: Select this tab and enter the company's **Register Number**.
- **QR Code**: A scannable E-Barimt QR code will appear on the screen for the customer to scan with their E-Barimt app.

---

## 5. Keyboard Shortcut Reference
| Key | Action |
| :--- | :--- |
| **F4** | **Confirm / Submit / Quick Cash** |
| **F3** | **Integrated Bank Terminal** |
| **0 - 9**| **Enter Amount** |
| **Backsp**| **Delete last digit** |
| **ESC** | **Close / Cancel Modal** |

---

## 6. Common Procedures

### Procedure: "Standard Cash Exit"
1. Press **F4** (on dashboard).
2. Press **F4** again (confirms full amount as cash).
3. Wait for the gate to open.

### Procedure: "Splitting Payment"
1. Customer wants to pay 2,000 in Cash and the rest by Card.
2. Type `2000` -> Click **Cash**.
3. Click **Card** (automatically selects the remaining balance).
4. Click **Save**.

### Procedure: "Correction / Reset"
- If you typed the wrong amount, click the **Orange Clear (X)** button on the numpad to reset the current input to 0.
