# payments — จ่ายเงิน + PromptPay QR
- entity: `Payment` (`src/payments/entities/payment.entity.ts`)
- controller: `payments.controller.ts` base `orders`, `promptpay-qr.controller.ts` base `stores`

## Endpoints
- `POST /orders/:id/pay` — ชำระเงิน `{ method, amount?, receivedAmount? }`
- `POST /stores/:storeId/promptpay-qr` (JWT) — สร้าง QR รับเงิน

## Rule
- method: `CASH|QR|DELIVERY_PLATFORM`, status `PAID|REFUNDED`
- `receiptId` มัก = `orderNumber`, `receiptToken` unique ใช้ดึงใบเสร็จ public
- **BE-owned total**: `Payment.amount = SUM(OrderItem.price * quantity)` เสมอ (`src/payments/payments.service.ts`)
  - `OrderItem.price` เป็น final unit price snapshot (base price + modifier adjustments)
  - `amount` จาก FE เป็น optional และใช้แค่ validate — ไม่ตรงกับ order total = `400`
  - QR/DELIVERY_PLATFORM: FE ส่งแค่ `method`, BE คำนวณ `amount`, `change = 0`
  - CASH: FE ส่ง `method + receivedAmount`, BE คำนวณ `amount` และ `change = receivedAmount - amount`
  - CASH ไม่มี `receivedAmount` หรือรับน้อยกว่า total = `400`
  - order ไม่มี items = `400`
