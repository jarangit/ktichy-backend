# order-station-item — งานบนจอครัว
- entity: `OrderStationItem` (`src/order-station-item/entities/`)
- controller: `src/order-station-item/order-station-item.controller.ts`

## Endpoints
- `POST /order-station-item` — สร้าง work item
- `GET /order-station-item`, `GET /order-station-item/:id`
- `GET /order-station-item/station/:stationId` — คิวของจอ station
- `PATCH /order-station-item/:id` — เปลี่ยน status
- `DELETE /order-station-item/:id`

## Rule
- status lowercase: `pending->complete->served` (ต่างจาก Order)
- 1 OrderItem แตกได้หลาย item ตาม station
