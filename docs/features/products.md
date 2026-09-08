# products — เมนู
- entity: `Product` (`src/products/entities/product.entity.ts`)
- controller: `src/products/products.controller.ts` base `products`

## Endpoints
- `POST /products` (JWT) — `{ storeId, stationId?, categoryId?, name, price, ... }`
- `GET /products`, `GET /products/:id`, `GET /products/category/:id`
- `GET /products/restaurant/:restaurantId`, `GET /products/store/:storeId` — legacy alias
- `PATCH /products/:id` (JWT), `DELETE /products/:id` (JWT)

## Rule
- `N:1 -> Store, Station?, Category?`
- ลบ Category = SET NULL; ลบ Store/Station = cascade
- `isActive` ปิดขายโดยไม่ลบ
- `1:N -> ProductModifierGroup` — ดู `docs/features/modifiers.md`
- `GET /products/:id` คืน `modifierGroups` (เฉพาะ active groups + available options)
