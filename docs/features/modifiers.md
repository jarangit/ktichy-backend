# modifiers — ตัวเลือกเพิ่มเติมของสินค้า

- entities: `ModifierGroup`, `ModifierOption`, `ProductModifierGroup` (`src/modifiers/entities/`)
- controller: `src/modifiers/modifiers.controller.ts` (JWT ทุก endpoint)
- selection/pricing logic: `src/modifiers/modifier-selection.service.ts` (ถูกเรียกโดย `OrdersService` ตอนสร้าง/แก้ order)

## Model

```text
Store 1:N ModifierGroup 1:N ModifierOption
Product 1:N ProductModifierGroup N:1 ModifierGroup
```

- `ModifierGroup` ผูก `Store` เสมอ — reuse ได้เฉพาะในร้านเดียวกัน
- `ProductModifierGroup` เป็น junction มี `sortOrder` + unique `(productId, modifierGroupId)`
- `selectionType`: `SINGLE | MULTIPLE`
- `minSelect/maxSelect`: `min >= 0`, `min <= max`, `SINGLE` ต้อง `max <= 1`
- `priceAdjustment`: decimal รองรับ 0 / บวก / ลบ

## Endpoints

- `POST /modifier-groups` — `{ storeId, name, selectionType, minSelect?, maxSelect? }`
- `GET /modifier-groups?storeId=:storeId`
- `GET /modifier-groups/:id`, `PATCH /modifier-groups/:id`
- `DELETE /modifier-groups/:id` — soft deactivate (`isActive=false`)
- `POST /modifier-groups/:groupId/options` — `{ name, priceAdjustment?, sortOrder?, isAvailable? }`
- `PATCH /modifier-options/:id`, `DELETE /modifier-options/:id` — soft deactivate (`isAvailable=false`)
- `POST /products/:productId/modifier-groups` — `{ modifierGroupId, sortOrder? }`
- `DELETE /products/:productId/modifier-groups/:modifierGroupId`

## Rules

- ทุก write ต้องเป็น owner ของ store; group กับ product ต้องอยู่ store เดียวกัน
- ห้ามย้าย group ข้าม store; ห้าม assign group ที่ inactive
- ห้ามปิด option จน active options เหลือน้อยกว่า `minSelect`
- Product detail และ product list endpoints (`GET /products/:id`, `GET /products/store/:storeId`, `GET /products/restaurant/:restaurantId`, `GET /products/category/:id`) คืน `modifierGroups` เฉพาะ active groups + available options (ไม่มี = `[]`)
- selection validation + คำนวณราคา: `finalUnitPrice = product.price + SUM(priceAdjustment)`
- `POST /orders` รับ `products[].modifiers[]` แล้ว; `OrderItem.price` คือราคารวม modifier;
  snapshot เก็บใน `order_item_modifier` (`src/orders/entities/order-item-modifier.entity.ts`)
