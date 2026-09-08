# public-receipts — ใบเสร็จ public
- controller: `src/public-receipts/public-receipts.controller.ts` base `public/receipts`

## Endpoints (public ไม่ต้อง JWT)
- `GET /public/receipts/:receiptToken` — ดึงใบเสร็จด้วย token จาก Payment

## Rule
- token = `Payment.receiptToken` (unique) มีวันหมดอายุ `receiptExpiresAt`
- ใช้ให้ลูกค้าเปิดใบเสร็จโดยไม่ login
