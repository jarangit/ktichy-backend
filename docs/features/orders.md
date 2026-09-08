# orders — ออเดอร์
- entity: `Order`, `OrderItem` (`src/orders/entities/`)
- controller: `src/orders/orders.controller.ts` base `orders`

## Endpoints
- `POST /orders` — สร้างพร้อม `items[]`
- `GET /orders`, `GET /orders/:id`
- `GET /orders/restaurant/:restaurantId`, `/store/:storeId`, `/station/:stationId`
- `PATCH /orders/:id` — เปลี่ยน status/type
- `DELETE /orders/:id`

## Rule
- status: `NEW->PREPARING->READY->COMPLETED|CANCELLED`
- type: `DINE_IN|TOGO|DELIVERY`
- OrderItem เก็บ snapshot `name/price/quantity/notes`
