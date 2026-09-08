# quick-note — note ลัดระดับร้าน
- entity: `QuickNote` (`src/quick-note/entities/`)
- controller: `src/quick-note/quick-note.controller.ts` base `quick-note` (JWT ทั้งหมด)

## Endpoints
- `GET /quick-note/store/:storeId` — list ตาม sortOrder
- `PUT /quick-note/store/:storeId` — bulk replace ทั้งชุด
- `POST /quick-note`, `PATCH /quick-note/:id`, `DELETE /quick-note/:id`

## Rule
- `text` ยาว <=60 ตัวอักษร
- มี ownership check ระดับ store แล้ว
