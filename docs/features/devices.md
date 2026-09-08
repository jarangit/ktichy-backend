# devices — อุปกรณ์จอ KDS
- entity: `Device` (`src/devices/entities/device.entity.ts`)
- controller: `src/devices/devices.controller.ts` base `devices`

## Endpoints
- `POST /devices` — ลงทะเบียน `{ deviceId, storeId?, stationId?, alias? }`
- `GET /devices/store/:storeId`, `GET /devices`, `GET /devices/:id`
- `PATCH /devices/:id` — ย้าย station/เปลี่ยน alias/status
- `DELETE /devices/:id`

## Rule
- status: `UNPAIRED|PENDING|PAIRED|DISABLED`
- `deviceId` unique ระดับ hardware
- ระวัง: มี relation + explicit FK column ซ้อนกัน (`store_id/station_id`)
