# realtime — websocket อัปเดตสด
- gateway: `src/realtime/realtime.gateway.ts` (`@WebSocketGateway`)
- module: `src/realtime/realtime.module.ts` export `RealtimeGateway` ให้ feature อื่น emit

## Events
- `join-room` / `leave-room` — เข้า/ออกห้องตาม `storeId`
- `receipt.join` / `receipt.leave` — ห้องตาม `receiptToken`

## Rule
- ใช้ push event ออเดอร์/สถานะไปจอครัวและหน้าใบเสร็จ
- ปัจจุบันมีแค่ join/leave, event ธุรกิจ emit จาก service อื่น
