# stations — สถานีครัว
- entity: `Station` (`src/stations/entities/station.entity.ts`)
- controller: `src/stations/stations.controller.ts` base `stations`

## Endpoints
- `POST /stations` — สร้าง `{ storeId, name, color }`
- `GET /stations`, `GET /stations/:id`
- `GET /stations/device` (JWT) — สำหรับ device ดู station
- `GET /stations/restaurant/:restaurantId`, `GET /stations/store/:storeId` — legacy alias
- `PATCH /stations/:id`, `DELETE /stations/:id`

## Rule
- `N:1 -> Store`, ลบ cascade ไป Product/OrderStationItem
- Product ผูก `stationId` เพื่อ route งานครัว
