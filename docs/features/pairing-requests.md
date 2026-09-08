# pairing-requests — คำขอจับคู่ (ยัง partial)
- entity: `PairingRequest` (`src/pairing-requests/entities/`)
- controller: `src/pairing-requests/pairing-requests.controller.ts`

## Endpoints
- `PATCH /pairing-requests/:id/approve` (JWT) — อนุมัติคำขอเท่านั้น

## Rule
- status: `WAITING_APPROVAL|APPROVED|REJECTED|EXPIRED|CANCELLED`
- gap: ยังไม่มี endpoint สร้าง request, approve จึงเป็น orphaned
- flow ที่ควรเป็น: device join -> สร้าง request -> owner approve -> PAIRED
