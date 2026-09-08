# stores — ร้าน + PIN
- entity: `Store` (`src/stores/entities/store.entity.ts`)
- controller: `src/stores/stores.controller.ts` route `stores,restaurants`

## Endpoints (JWT ทั้งหมด)
- `POST /stores` — สร้างร้าน body `{ name }`, owner = JWT sub
- `POST /stores/:id/pin` — ตั้ง PIN 4-6 หลัก (owner)
- `GET /stores`, `GET /stores/:id`, `GET /stores/user/:userId`
- `PATCH /stores/:id` — แก้ settings/orderLimit ต้องส่ง `pin` ทุกครั้ง
- `DELETE /stores/:id`

## Rule
- `pinHash` bcrypt ไม่ส่งออก
- ร้านไม่มี PIN -> PATCH โดน `STORE_PIN_REQUIRED`
- detail ดู `../api-store-pin.md`
