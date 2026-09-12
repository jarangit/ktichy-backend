# Modifiers API (FE Spec)

เอกสารนี้สำหรับฝั่ง FE เพื่อเรียก API Product Modifier System (ตัวเลือกเพิ่มเติมของสินค้า เช่น Size / Sweetness / Toppings)

> Base prefix: `/api/v1` (ตั้งใน `src/main.ts:12`)
> Response ถูกครอบด้วย `ResponseInterceptor` รูปแบบ `{ success, message, data }` เสมอ `src/common/interceptor/response.interceptor.ts:15`
> Validation: `ValidationPipe { whitelist: true, transform: true }` `src/main.ts:19` — field ที่ไม่อยู่ใน DTO จะถูก strip ออก
> Auth: ทุก endpoint ในหน้านี้ต้องใช้ JWT Bearer token (`@UseGuards(JwtAuthGuard)` `src/modifiers/modifiers.controller.ts:22`) ยกเว้น `GET /products/:id` ที่เปิด public เหมือนเดิม

Base URL ตัวอย่าง

- Local: `http://localhost:3000`
- Full: `http://localhost:3000/api/v1/modifier-groups`

---

## 1. Enums

**ModifierSelectionType** `src/modifiers/entities/modifier-group.entity.ts:11`

```
SINGLE | MULTIPLE
```

- `SINGLE` = radio เลือกได้ 1 ตัว (บังคับ `maxSelect <= 1`)
- `MULTIPLE` = checkbox เลือกได้ `minSelect`–`maxSelect` ตัว

**Concept**

- `ModifierGroup` = หัวข้อตัวเลือก (Size, Sweetness, Toppings) — ผูกกับ `Store` เสมอ ใช้ซ้ำได้เฉพาะในร้านเดียวกัน
- `ModifierOption` = ตัวเลือกใน group (Small, Large, Extra Shot) มี `priceAdjustment` (บวก/ลบ/ศูนย์)
- `ProductModifierGroup` = การผูก group เข้ากับ product มี `sortOrder` + unique `(productId, modifierGroupId)`

---

## 2. POST /modifier-groups — สร้าง group

**Endpoint**

- Method: `POST`
- URL: `/api/v1/modifier-groups`
- Auth: JWT
- Controller: `src/modifiers/modifiers.controller.ts:27`
- DTO: `src/modifiers/dto/create-modifier-group.dto.ts:7`

**Request Body**

| Field           | Type     | Required | Rule               | Note                              |
| --------------- | -------- | -------- | ------------------ | --------------------------------- |
| `storeId`       | `string` | ✅       | `@IsNotEmpty()`    | id ของ store (10-char nanoid)     |
| `name`          | `string` | ✅       | `@IsNotEmpty()`    | ชื่อ group เช่น `Size`            |
| `selectionType` | `enum`   | ✅       | `SINGLE\|MULTIPLE` |                                   |
| `minSelect`     | `number` |          | `@IsInt() @Min(0)` | default: `SINGLE`=1, `MULTIPLE`=0 |
| `maxSelect`     | `number` |          | `@IsInt() @Min(0)` | default: `SINGLE`=1, `MULTIPLE`=0 |

> Rules ฝั่ง service `src/modifiers/modifiers.service.ts:110`: `minSelect <= maxSelect`, `SINGLE` ต้อง `maxSelect <= 1`

**Request Example**

```json
{
  "storeId": "store00001",
  "name": "Size",
  "selectionType": "SINGLE",
  "minSelect": 1,
  "maxSelect": 1
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "mg00000001",
    "storeId": "store00001",
    "name": "Size",
    "selectionType": "SINGLE",
    "minSelect": 1,
    "maxSelect": 1,
    "isActive": true,
    "options": [],
    "createdAt": "2026-09-08T10:00:00.000Z",
    "updatedAt": "2026-09-08T10:00:00.000Z"
  }
}
```

**Error Response**

400 — `minSelect > maxSelect`

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "minSelect must not exceed maxSelect",
  "timestamp": "2026-09-08T00:00:00.000Z",
  "path": "/api/v1/modifier-groups"
}
```

403 — ไม่ใช่ owner ของ store

```json
{
  "statusCode": 403,
  "error": "ForbiddenException",
  "message": "User #u1 is not the owner of store #store00001",
  "timestamp": "2026-09-08T00:00:00.000Z",
  "path": "/api/v1/modifier-groups"
}
```

---

## 3. GET /modifier-groups — รายการ groups ของร้าน (หน้า admin)

**Endpoint**

- Method: `GET`
- URL: `/api/v1/modifier-groups?storeId=:storeId`
- Auth: JWT
- Controller: `src/modifiers/modifiers.controller.ts:32`

**Query Params**

| Field     | Type     | Required | Note           |
| --------- | -------- | -------- | -------------- |
| `storeId` | `string` | ✅       | ไม่ส่ง = `400` |

> คืนทั้ง active และ inactive (หน้า admin ต้องเห็นของที่ปิดเพื่อเปิดกลับ) — หน้า POS ไม่ใช้เส้นนี้ ให้ใช้ `GET /products/store/:storeId` หรือ `GET /products/:id` แทน

**Success Response** `200 OK` — array ของ group shape เดียวกับข้อ 2 (พร้อม `options[]`)

---

## 4. GET /modifier-groups/:id — ดู group เดียว

**Endpoint**

- Method: `GET`
- URL: `/api/v1/modifier-groups/:id`
- Auth: JWT

**Success Response** `200 OK` — group shape เดียวกับข้อ 2 พร้อม `options[]` ทั้ง available/unavailable

**Error Response** `404`

```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Modifier group #mg00000001 not found",
  "timestamp": "2026-09-08T00:00:00.000Z",
  "path": "/api/v1/modifier-groups/mg00000001"
}
```

---

## 5. PATCH /modifier-groups/:id — แก้ไข group

**Endpoint**

- Method: `PATCH`
- URL: `/api/v1/modifier-groups/:id`
- Auth: JWT
- DTO: `src/modifiers/dto/update-modifier-group.dto.ts:5` (`PartialType` ของ create — ส่งเฉพาะ field ที่จะแก้)

**Request Body** — optional ทั้งหมด: `storeId` (ห้ามเปลี่ยนร้าน — ส่งค่าต่างจากเดิม = `400`), `name`, `selectionType`, `minSelect`, `maxSelect`

> service validate merged state สุดท้าย ไม่ใช่แค่ field ที่ส่งมา (เช่น group เดิม `maxSelect: 5` ส่ง `selectionType: SINGLE` อย่างเดียวจะโดน `400`)

**Request Example**

```json
{
  "name": "Cup Size",
  "maxSelect": 1
}
```

---

## 6. DELETE /modifier-groups/:id — ปิดใช้งาน group (soft)

**Endpoint**

- Method: `DELETE`
- URL: `/api/v1/modifier-groups/:id`
- Auth: JWT

> ไม่ลบข้อมูลจริง — เปลี่ยน `isActive=false` (`src/modifiers/modifiers.service.ts:170`) group ที่ปิดแล้วจะหายจาก `GET /products/:id` และห้าม assign ใหม่

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": { "message": "Modifier group #mg00000001 has been deactivated" }
}
```

---

## 7. POST /modifier-groups/:groupId/options — เพิ่ม option

**Endpoint**

- Method: `POST`
- URL: `/api/v1/modifier-groups/:groupId/options`
- Auth: JWT
- DTO: `src/modifiers/dto/create-modifier-option.dto.ts:8`

**Request Body**

| Field             | Type      | Required | Rule                           | Note                              |
| ----------------- | --------- | -------- | ------------------------------ | --------------------------------- |
| `name`            | `string`  | ✅       | `@IsNotEmpty()`                | เช่น `Large`                      |
| `priceAdjustment` | `number`  |          | default `0`                    | รองรับค่าลบ (เช่น `No Side: -20`) |
| `sortOrder`       | `number`  |          | `@IsInt() @Min(0)` default `0` | ลำดับแสดงผล                       |
| `isAvailable`     | `boolean` |          | default `true`                 |                                   |

**Request Example**

```json
{
  "name": "Large",
  "priceAdjustment": 20,
  "sortOrder": 3
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "mo00000001",
    "modifierGroupId": "mg00000001",
    "name": "Large",
    "priceAdjustment": 20,
    "sortOrder": 3,
    "isAvailable": true,
    "createdAt": "2026-09-08T10:00:00.000Z",
    "updatedAt": "2026-09-08T10:00:00.000Z"
  }
}
```

---

## 8. PATCH /modifier-options/:id — แก้ไข / เปิด-ปิด option

**Endpoint**

- Method: `PATCH`
- URL: `/api/v1/modifier-options/:id`
- Auth: JWT
- DTO: `src/modifiers/dto/update-modifier-option.dto.ts:4` (optional ทั้งหมด: `name`, `priceAdjustment`, `sortOrder`, `isAvailable`)

**ปิด option ชั่วคราว**

```json
{
  "isAvailable": false
}
```

> ห้ามปิดจน active options เหลือน้อยกว่า `minSelect` ของ group — จะโดน `400` (`src/modifiers/modifiers.service.ts:228`)
>
> ```json
> {
>   "statusCode": 400,
>   "error": "BadRequestException",
>   "message": "Cannot disable option: group requires at least 1 active option(s)"
> }
> ```

---

## 9. DELETE /modifier-options/:id — ปิดใช้งาน option (soft)

**Endpoint**

- Method: `DELETE`
- URL: `/api/v1/modifier-options/:id`
- Auth: JWT

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": { "message": "Modifier option #mo00000001 has been deactivated" }
}
```

---

## 10. POST /products/:productId/modifier-groups — ผูก group กับ product

**Endpoint**

- Method: `POST`
- URL: `/api/v1/products/:productId/modifier-groups`
- Auth: JWT
- DTO: `src/modifiers/dto/assign-modifier-group.dto.ts:3`

**Request Body**

| Field             | Type     | Required | Rule                                                    |
| ----------------- | -------- | -------- | ------------------------------------------------------- |
| `modifierGroupId` | `string` | ✅       | `@IsNotEmpty()`                                         |
| `sortOrder`       | `number` |          | `@IsInt() @Min(0)` default `0` — ลำดับ group บนหน้า POS |

**Request Example**

```json
{
  "modifierGroupId": "mg00000001",
  "sortOrder": 1
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "pmg0000001",
    "productId": "prod000001",
    "modifierGroupId": "mg00000001",
    "sortOrder": 1
  }
}
```

**Error Response**

400 — group อยู่คนละ store กับ product

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Modifier group #mg00000001 does not belong to the product's store",
  "timestamp": "2026-09-08T00:00:00.000Z",
  "path": "/api/v1/products/prod000001/modifier-groups"
}
```

400 — group ถูกปิดใช้งาน

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Modifier group #mg00000001 is not active",
  "timestamp": "2026-09-08T00:00:00.000Z",
  "path": "/api/v1/products/prod000001/modifier-groups"
}
```

409 — ผูกซ้ำ

```json
{
  "statusCode": 409,
  "error": "ConflictException",
  "message": "Modifier group #mg00000001 is already assigned to product #prod000001",
  "timestamp": "2026-09-08T00:00:00.000Z",
  "path": "/api/v1/products/prod000001/modifier-groups"
}
```

---

## 11. DELETE /products/:productId/modifier-groups/:modifierGroupId — ถอด group ออกจาก product

**Endpoint**

- Method: `DELETE`
- URL: `/api/v1/products/:productId/modifier-groups/:modifierGroupId`
- Auth: JWT

> ลบแค่ความสัมพันธ์ (junction row) — ตัว group และ options ยังอยู่ เอาไปผูก product อื่นได้

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Modifier group #mg00000001 removed from product #prod000001"
  }
}
```

---

## 12. Product List/Detail — เพิ่ม `modifierGroups`

**Endpoint**

- Method: `GET`
- URLs: `/api/v1/products/:id`, `/api/v1/products/store/:storeId`, `/api/v1/products/restaurant/:restaurantId`, `/api/v1/products/category/:id`
- Auth: `none` (เหมือนเดิม)
- Service: `src/products/products.service.ts:226`

**สิ่งที่เปลี่ยน**: Product detail และ product list เพิ่ม field `modifierGroups` ท้าย product object — fields เดิมทุกตัวอยู่ครบ ไม่เปลี่ยนชื่อ/ลบอะไร

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "prod000001",
    "name": "Americano",
    "isActive": true,
    "isBestSeller": false,
    "price": 60,
    "cost": null,
    "imageUrl": null,
    "storeId": "store00001",
    "stationId": "st00000001",
    "categoryId": "cat0000001",
    "categoryName": "Coffee",
    "stationName": "Drinks",
    "createdAt": "2026-09-08T10:00:00.000Z",
    "updatedAt": "2026-09-08T10:00:00.000Z",
    "modifierGroups": [
      {
        "id": "mg00000001",
        "name": "Size",
        "selectionType": "SINGLE",
        "minSelect": 1,
        "maxSelect": 1,
        "sortOrder": 1,
        "options": [
          {
            "id": "mo00000001",
            "name": "Small",
            "priceAdjustment": 0,
            "sortOrder": 1,
            "isAvailable": true
          },
          {
            "id": "mo00000002",
            "name": "Medium",
            "priceAdjustment": 10,
            "sortOrder": 2,
            "isAvailable": true
          },
          {
            "id": "mo00000003",
            "name": "Large",
            "priceAdjustment": 20,
            "sortOrder": 3,
            "isAvailable": true
          }
        ]
      },
      {
        "id": "mg00000002",
        "name": "Extra",
        "selectionType": "MULTIPLE",
        "minSelect": 0,
        "maxSelect": 5,
        "sortOrder": 2,
        "options": [
          {
            "id": "mo00000004",
            "name": "Extra Shot",
            "priceAdjustment": 20,
            "sortOrder": 1,
            "isAvailable": true
          }
        ]
      }
    ]
  }
}
```

Field notes:

- response นี้ filter ให้แล้ว: group ที่ `isActive=false` และ option ที่ `isAvailable=false` จะไม่ปรากฏ — FE เอาไป render ขายได้เลยไม่ต้อง filter เอง
- product ไม่มี modifier = `"modifierGroups": []` (ไม่ใช่ `null`) ทั้งใน list และ detail
- `sortOrder` ของ group = ลำดับแสดงผลบน POS, `sortOrder` ของ option = ลำดับใน group
- ราคาต่อหน่วยที่ FE ใช้ preview: `price + Σ priceAdjustment` ของ option ที่เลือก

---

## 13. Error Table รวม (สำหรับหน้า admin)

| Case                                                    | HTTP | message                                                             |
| ------------------------------------------------------- | ---- | ------------------------------------------------------------------- |
| `storeId` หาย / ว่าง                                    | 400  | `storeId is required` / `storeId should not be empty`               |
| `minSelect > maxSelect`                                 | 400  | `minSelect must not exceed maxSelect`                               |
| `SINGLE` แต่ `maxSelect > 1`                            | 400  | `SINGLE groups must have maxSelect <= 1`                            |
| ย้าย group ข้าม store (PATCH ส่ง `storeId` ต่างจากเดิม) | 400  | `Moving a group between stores is not allowed`                      |
| assign group ข้าม store                                 | 400  | `Modifier group #... does not belong to the product's store`        |
| assign group ที่ปิดแล้ว                                 | 400  | `Modifier group #... is not active`                                 |
| ปิด option จนเหลือไม่พอ `minSelect`                     | 400  | `Cannot disable option: group requires at least N active option(s)` |
| ไม่ใช่ owner ของ store                                  | 403  | `User #... is not the owner of store #...`                          |
| group/product ไม่เจอ                                    | 404  | `Modifier group #... not found` / `Product #... not found`          |
| assign group ซ้ำ                                        | 409  | `Modifier group #... is already assigned to product #...`           |
| ถอด group ที่ไม่ได้ผูก                                  | 404  | `Modifier group #... is not assigned to product #...`               |

---

## 14. สิ่งที่ยังทำไม่ได้ (กันเข้าใจผิด)

- Order API รับ `modifiers` แล้ว — ส่ง `products[].modifiers[]` เป็น
  `{ "modifierGroupId": "...", "modifierOptionIds": ["..."] }`;
  server validate + คิดราคาเอง (`price = base + Σ priceAdjustment`) และเก็บ snapshot ลง `order_item_modifier`
- ไม่มี global modifier — ทุก group อยู่ใต้ store ต้องส่ง `storeId` ทุกครั้งตอน create/list
- `DELETE` ทั้ง group/option เป็น soft deactivate ไม่ลบจริง — list admin ยังเห็นของที่ปิดพร้อม flag
- ไม่มี selection validate endpoint — pricing preview FE คำนวณเองจากสูตร `price + Σ priceAdjustment` ได้เลย

---

## 15. FE Checklist

- [ ] ทุก request ในข้อ 2–11 แนบ `Authorization: Bearer <token>`
- [ ] หน้า admin: create/list ใช้ `storeId` ของร้านปัจจุบันเสมอ
- [ ] หน้า admin: `SINGLE` render ฟอร์ม `min/max` แบบ lock `max <= 1`; `MULTIPLE` ให้กรอก `min/max` อิสระ
- [ ] หน้า admin: handle `409` ตอน assign ซ้ำ (แสดง "ผูกแล้ว" แทน error แดง)
- [ ] หน้า admin: ปุ่มปิด option ต้อง handle `400 minSelect` (บอก user ว่าเหลือขั้นต่ำกี่ตัว)
- [ ] หน้า POS: `SINGLE` → radio, `MULTIPLE` → checkbox จำกัด `minSelect`–`maxSelect`
- [ ] หน้า POS: ใช้ `GET /products/store/:storeId` เพื่อโหลด products + modifiers ทั้งร้านใน call เดียว หรือใช้ `GET /products/:id` เมื่อเปิด detail เฉพาะสินค้า
- [ ] หน้า POS: ราคา preview = `price + Σ priceAdjustment` (ระวังทศนิยม — `priceAdjustment` เป็น decimal)
- [ ] หน้า POS: อย่าใช้ `GET /modifier-groups` (เส้น admin เห็นของที่ปิดด้วย)
- [ ] product list ทั้งร้าน (`/products/store/:storeId`) มี `modifierGroups` แล้ว ถ้าไม่มี modifier จะเป็น `[]`

---

## 16. TypeScript Types สำหรับ FE

```ts
export type ModifierSelectionType = 'SINGLE' | 'MULTIPLE';

export type ModifierGroupView = {
  id: string;
  storeId: string | null;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: ModifierOptionView[];
  createdAt: string;
  updatedAt: string;
};

export type ModifierOptionView = {
  id: string;
  modifierGroupId: string | null;
  name: string;
  priceAdjustment: number;
  sortOrder: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductModifierGroupView = {
  id: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: {
    id: string;
    name: string;
    priceAdjustment: number;
    sortOrder: number;
    isAvailable: boolean;
  }[];
};

// Product list/detail responses add this field to each ProductView.
export type ProductWithModifiersView = ProductView & {
  modifierGroups: ProductModifierGroupView[];
};

// Selection payload used by POS and order creation.
export type ModifierSelection = {
  modifierGroupId: string;
  modifierOptionIds: string[];
};

export function calcUnitPrice(
  basePrice: number,
  groups: ProductModifierGroupView[],
  sel: ModifierSelection[],
): number {
  const optPrice = new Map<string, number>();
  for (const g of groups)
    for (const o of g.options) optPrice.set(o.id, o.priceAdjustment);
  return (
    basePrice +
    sel
      .flatMap((s) => s.modifierOptionIds)
      .reduce((sum, id) => sum + (optPrice.get(id) ?? 0), 0)
  );
}
```

**FE Example**

```ts
const BASE = 'http://localhost:3000/api/v1';
const auth = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// Admin: สร้าง Size group + options + ผูกกับ Americano
const group = await (
  await fetch(`${BASE}/modifier-groups`, {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({
      storeId: 'store00001',
      name: 'Size',
      selectionType: 'SINGLE',
      minSelect: 1,
      maxSelect: 1,
    }),
  })
).json();
await fetch(`${BASE}/modifier-groups/${group.data.id}/options`, {
  method: 'POST',
  headers: auth(token),
  body: JSON.stringify({ name: 'Large', priceAdjustment: 20, sortOrder: 3 }),
});
await fetch(`${BASE}/products/prod000001/modifier-groups`, {
  method: 'POST',
  headers: auth(token),
  body: JSON.stringify({ modifierGroupId: group.data.id, sortOrder: 1 }),
});

// POS: ดึง products + modifiers ทั้งร้านใน call เดียว (public, ไม่ต้องใช้ token)
const products: { data: ProductWithModifiersView[] } = await (
  await fetch(`${BASE}/products/store/store00001`)
).json();
const product = products.data.find((p) => p.id === 'prod000001')!;
const preview = calcUnitPrice(product.price, product.modifierGroups, [
  { modifierGroupId: 'mg00000001', modifierOptionIds: ['mo00000003'] },
]); // 60 + 20 = 80
```

cURL

```bash
TOKEN="<jwt>"
curl -X POST http://localhost:3000/api/v1/modifier-groups \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"storeId":"store00001","name":"Size","selectionType":"SINGLE","minSelect":1,"maxSelect":1}'
curl "http://localhost:3000/api/v1/modifier-groups?storeId=store00001" \
  -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/api/v1/products/prod000001/modifier-groups \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"modifierGroupId":"mg00000001","sortOrder":1}'
curl http://localhost:3000/api/v1/products/store/store00001
curl http://localhost:3000/api/v1/products/prod000001
```
