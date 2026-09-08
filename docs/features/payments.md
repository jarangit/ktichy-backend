# payments — จ่ายเงิน + PromptPay QR
- entity: `Payment` (`src/payments/entities/payment.entity.ts`)
- controller: `payments.controller.ts` base `orders`, `promptpay-qr.controller.ts` base `stores`

## Endpoints
- `POST /orders/:id/pay` — ชำระเงิน `{ method, amount, receivedAmount? }`
- `POST /stores/:storeId/promptpay-qr` (JWT) — สร้าง QR รับเงิน

## Rule
- method: `CASH|QR|DELIVERY_PLATFORM`, status `PAID|REFUNDED`
- `receiptId` มัก = `orderNumber`, `receiptToken` unique ใช้ดึงใบเสร็จ public
- `change = receivedAmount - amount` (เงินสด)
