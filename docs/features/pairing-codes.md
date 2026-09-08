# pairing-codes — code จับคู่อุปกรณ์
- entity: `PairingCode` (`src/pairing-codes/entities/`)
- controller: `src/pairing-codes/pairing-codes.controller.ts`

## Endpoints
- `POST /pairing-codes` — สร้าง code `{ storeId, stationId?, expiresAt? }`
- `POST /pairing-codes/:code/join` — device ใช้ code join
- `GET /pairing-codes`, `GET /pairing-codes/:id`
- `PATCH /pairing-codes/:id`, `DELETE /pairing-codes/:id`

## Rule
- status: `PENDING->EXPIRED|CLOSED`
- `code` unique, มีหมดอายุ
- ปัจจุบัน join แล้ว auto-PAIRED (flow ใหม่อาจเปลี่ยนเป็น request+approve)
