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
- `price` ของ OrderItem คือราคารวม modifier ต่อชิ้น (`base + Σ priceAdjustment`) คำนวณฝั่ง server เท่านั้น
- ส่ง modifier ต่อสินค้าได้ด้วย `products[].modifiers[]`:
  `{ "modifierGroupId": "...", "modifierOptionIds": ["..."] }`
- server validate ว่า group ถูก assign กับ product, option อยู่ใน group และยัง available, จำนวนอยู่ใน `minSelect..maxSelect`
- group ที่ `minSelect > 0` ต้องส่ง selection มาด้วยเสมอ
- `order_item_modifier` เก็บ snapshot `group/option name + priceAdjustment` ณ เวลาสั่ง
