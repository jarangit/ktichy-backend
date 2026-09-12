# Products API (FE Spec)

เอกสารนี้สำหรับฝั่ง FE เพื่อเรียก API สินค้า (CRUD + list/detail + อัปโหลดรูป) ครอบคลุม payload ที่รองรับทั้งหมดและผลลัพธ์ที่ได้

> Base prefix: `/api/v1` (ตั้งใน `src/main.ts:12`)
> Response ถูกครอบด้วย `ResponseInterceptor` รูปแบบ `{ success, message, data }` เสมอ `src/common/interceptor/response.interceptor.ts:15`
> Validation: `ValidationPipe { whitelist: true, transform: true }` `src/main.ts:19` — field ที่ไม่อยู่ใน DTO จะถูก strip ออก
> เรื่อง modifier (`modifierGroups` shape, assign group/option, selection rules) ดู `docs/api-modifiers.md` — เอกสารนี้ไม่อธิบายซ้ำ

Base URL ตัวอย่าง
- Local: `http://localhost:3000`
- Full: `http://localhost:3000/api/v1/products`

---

## 1. Auth Matrix

| Endpoint | Auth | หมายเหตุ |
|----------|------|----------|
| `POST /products` | JWT | owner ของ store เท่านั้น |
| `GET /products/store/:storeId` | none | public |
| `GET /products/restaurant/:restaurantId` | none | legacy alias ของ store |
| `GET /products/category/:id` | none | public |
| `GET /products/:id` | none | public |
| `PATCH /products/:id` | JWT | owner ของ store เท่านั้น |
| `DELETE /products/:id` | JWT | owner ของ store เท่านั้น |
| `POST /uploads/product-image` | JWT | ต้อง login |

Controller: `src/products/products.controller.ts:18`, `src/uploads/uploads.controller.ts:15`

---

## 2. POST /products — สร้างสินค้า

**Endpoint**
- Method: `POST`
- URL: `/api/v1/products`
- Auth: JWT
- DTO: `src/products/dto/create-menu.dto.ts:11`
- Service: `src/products/products.service.ts:151`

**Request Body**

| Field | Type | Required | Rule | Note |
|-------|------|----------|------|------|
| `name` | `string` | ✅ | `@IsNotEmpty()` | ชื่อสินค้า |
| `storeId` | `string` | ✅ | `@IsNotEmpty()` | id ของ store (10-char nanoid) |
| `stationId` | `string` | ✅ | `@IsNotEmpty()` | station ต้องอยู่ใน store เดียวกัน |
| `categoryId` | `string` |  | optional, ถ้าส่งต้อง `@IsNotEmpty()` | category ต้องอยู่ใน store เดียวกัน |
| `price` | `number` | ✅ | `@IsNumber() @Min(0)` | ราคาขาย (base price — modifier เป็นส่วนต่าง, ดู `api-modifiers.md`) |
| `cost` | `number` |  | `@IsNumber() @Min(0)` | ต้นทุน |
| `isBestSeller` | `boolean` |  | default `false` | |
| `imageUrl` | `string \| null` |  | optional, ส่ง `null` ได้ | URL จากข้อ 9 หรือ URL ภายนอกก็ได้ |

**Request Example**
```json
{
  "name": "Americano",
  "storeId": "store00001",
  "stationId": "st00000001",
  "categoryId": "cat0000001",
  "price": 60,
  "cost": 25,
  "isBestSeller": true,
  "imageUrl": "https://storage.googleapis.com/bucket/products/abc1234567.webp"
}
```

**Success Response** `201 Created` — product view เดียว (ยังไม่มี `modifierGroups`, เพราะสินค้าใหม่ยังไม่ถูก assign group)
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "prod000001",
    "name": "Americano",
    "isActive": true,
    "isBestSeller": true,
    "price": 60,
    "cost": 25,
    "imageUrl": "https://storage.googleapis.com/bucket/products/abc1234567.webp",
    "storeId": "store00001",
    "stationId": "st00000001",
    "categoryId": "cat0000001",
    "categoryName": "Coffee",
    "stationName": "Drinks",
    "createdAt": "2026-09-12T10:00:00.000Z",
    "updatedAt": "2026-09-12T10:00:00.000Z"
  }
}
```

**Error Response**

400 — `storeId` หาย
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "storeId is required",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products"
}
```

400 — validation fail (เช่น `price` ติดลบ / `name` ว่าง)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["price must not be less than 0", "name should not be empty"],
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products"
}
```

400 — ไม่ใช่ owner / station อยู่คนละ store / category อยู่คนละ store
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Station #st00000001 does not belong to store #store00001",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products"
}
```

404 — store/station/category ไม่เจอ
```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Station #st00000001 not found",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products"
}
```

---

## 3. GET /products/store/:storeId — รายการสินค้าทั้งร้าน (หน้า POS/menu)

**Endpoint**
- Method: `GET`
- URL: `/api/v1/products/store/:storeId`
- Auth: none
- Service: `src/products/products.service.ts:285`

> ใช้เส้นนี้โหลด menu ทั้งร้านพร้อม modifiers ใน call เดียว — ทุก product มี `modifierGroups` เสมอ (ไม่มี = `[]`)

**Path Params**

| Field | Type | Required |
|-------|------|----------|
| `storeId` | `string` | ✅ |

**Success Response** `200 OK` — array ของ product view + `modifierGroups` (shape เต็มดู `docs/api-modifiers.md` หัวข้อ 12)
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "prod000001",
      "name": "Americano",
      "isActive": true,
      "isBestSeller": true,
      "price": 60,
      "cost": 25,
      "imageUrl": null,
      "storeId": "store00001",
      "stationId": "st00000001",
      "categoryId": "cat0000001",
      "categoryName": "Coffee",
      "stationName": "Drinks",
      "createdAt": "2026-09-12T10:00:00.000Z",
      "updatedAt": "2026-09-12T10:00:00.000Z",
      "modifierGroups": [
        {
          "id": "mg00000001",
          "name": "Size",
          "selectionType": "SINGLE",
          "minSelect": 1,
          "maxSelect": 1,
          "sortOrder": 1,
          "options": [
            { "id": "mo00000001", "name": "Small", "priceAdjustment": 0, "sortOrder": 1, "isAvailable": true },
            { "id": "mo00000003", "name": "Large", "priceAdjustment": 20, "sortOrder": 3, "isAvailable": true }
          ]
        }
      ]
    },
    {
      "id": "prod000002",
      "name": "Orange Juice",
      "isActive": true,
      "isBestSeller": false,
      "price": 30,
      "cost": null,
      "imageUrl": null,
      "storeId": "store00001",
      "stationId": "st00000001",
      "categoryId": "cat0000001",
      "categoryName": "Coffee",
      "stationName": "Drinks",
      "createdAt": "2026-09-12T10:00:00.000Z",
      "updatedAt": "2026-09-12T10:00:00.000Z",
      "modifierGroups": []
    }
  ]
}
```

Field notes:
- `modifierGroups` filter ให้แล้ว: เฉพาะ active groups + available options — FE render ขายได้เลย
- ราคา preview ต่อหน่วย: `price + Σ priceAdjustment` ของ option ที่เลือก
- `cost` ใช้หลังบ้าน ไม่ต้องโชว์ POS

**Error Response**

404 — ร้านไม่มีสินค้าเลย
```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "No products found for store #store00001",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products/store/store00001"
}
```

---

## 4. GET /products/restaurant/:restaurantId — legacy alias

**Endpoint**
- Method: `GET`
- URL: `/api/v1/products/restaurant/:restaurantId`
- Auth: none
- Service: `src/products/products.service.ts:281` — delegate ไป `findByStoreId` ตรง ๆ

> response เหมือนข้อ 3 ทุกประการ แนะนำให้ FE ใหม่ใช้ `/products/store/:storeId`

---

## 5. GET /products/category/:id — รายการสินค้าตามหมวด

**Endpoint**
- Method: `GET`
- URL: `/api/v1/products/category/:id`
- Auth: none
- Service: `src/products/products.service.ts:225`

> response เป็น array shape เดียวกับข้อ 3 (รวม `modifierGroups`) — ต่างแค่กรองตาม category

**Success Response** `200 OK` — array (หมวดที่ไม่มีสินค้าคืน `[]`, ไม่ใช่ 404)

---

## 6. GET /products/:id — รายละเอียดสินค้า

**Endpoint**
- Method: `GET`
- URL: `/api/v1/products/:id`
- Auth: none
- Service: `src/products/products.service.ts:233`

> response เป็น object เดี่ยว shape เดียวกับ item ในข้อ 3 (รวม `modifierGroups`)

**Error Response** `404`
```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Product #prod000001 not found",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products/prod000001"
}
```

---

## 7. PATCH /products/:id — แก้ไขสินค้า

**Endpoint**
- Method: `PATCH`
- URL: `/api/v1/products/:id`
- Auth: JWT (owner ของ store)
- DTO: `src/products/dto/update-menu.dto.ts:4` (`PartialType` ของ create — ส่งเฉพาะ field ที่จะแก้)
- Service: `src/products/products.service.ts:244`

**Request Body** — optional ทั้งหมด: `name`, `storeId`, `stationId`, `categoryId`, `price`, `cost`, `isBestSeller`, `imageUrl`

Rules (`resolveRelations`):
- เปลี่ยน `storeId` ได้ แต่ต้องเป็น store ที่ user เป็น owner
- เปลี่ยน `stationId`/`categoryId` ต้องอยู่ใน store ปลายทาง (หลังย้าย) ไม่ตรง = `400`
- ส่ง `categoryId` โดยไม่มี store context = `400 storeId is required when assigning a category`
- เปลี่ยนรูป: ส่ง `imageUrl` ใหม่ (หรือ `null` เพื่อลบรูป) — **รูปเก่าบน GCS จะถูกลบอัตโนมัติ** ถ้าไม่มี product อื่นใช้ URL เดียวกัน
- response เป็น product view เดียว **ไม่มี** `modifierGroups` (mutation response)

**Request Examples**

เปลี่ยนราคา + ตั้ง best seller
```json
{
  "price": 65,
  "isBestSeller": true
}
```

เปลี่ยนรูป
```json
{
  "imageUrl": "https://storage.googleapis.com/bucket/products/new1234567.webp"
}
```

ลบรูป
```json
{
  "imageUrl": null
}
```

ย้ายหมวด
```json
{
  "categoryId": "cat0000002"
}
```

**Error Response**

403 — ไม่ใช่ owner
```json
{
  "statusCode": 403,
  "error": "ForbiddenException",
  "message": "User #u1 does not have access to product #prod000001",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/products/prod000001"
}
```

---

## 8. DELETE /products/:id — ลบสินค้า

**Endpoint**
- Method: `DELETE`
- URL: `/api/v1/products/:id`
- Auth: JWT (owner ของ store)

> hard delete (`src/products/products.service.ts:270`): ลบ row จริง + ลบรูปบน GCS + cascade ลบ product-modifier links (ตัว ModifierGroup/Option ไม่ถูกลบ เอาไปใช้กับ product อื่นต่อได้) — ปิดการขายชั่วคราวให้ใช้ `PATCH { "isActive": false }` แทน (field นี้ไม่มีใน DTO ต้องส่งผ่าน update ตรง — BE ปัจจุบัน strip field นอก DTO ดังนั้นปิดขายผ่าน `isActive` ยังทำไม่ได้ ต้องลบหรือรอ BE เพิ่ม field)

**Success Response** `200 OK`
```json
{
  "success": true,
  "message": "Success",
  "data": { "message": "Product #prod000001 has been removed" }
}
```

---

## 9. POST /uploads/product-image — อัปโหลดรูปสินค้า

**Endpoint**
- Method: `POST`
- URL: `/api/v1/uploads/product-image`
- Auth: JWT
- Controller: `src/uploads/uploads.controller.ts:19`
- Service: `src/uploads/uploads.service.ts:104`

**Request** — `multipart/form-data` field เดียว:

| Field | Type | Required | Rule |
|-------|------|----------|------|
| `file` | `file` | ✅ | ต้องเป็น `image/*`, ไม่เกิน 50MB |

> server แปลงรูปเป็น WebP (ด้านยาวสุด 2560px, quality 80) แล้วเก็บที่ GCS path `products/<nanoid>.webp`

**Success Response** `201 Created`
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "imageUrl": "https://storage.googleapis.com/bucket/products/abc1234567.webp"
  }
}
```

> เอา `imageUrl` นี้ไปใส่ใน `POST /products` หรือ `PATCH /products/:id`

**Error Response**

400 — ไม่แนบไฟล์ / ไม่ใช่รูป / ไฟล์เกิน 50MB / ประมวลผลรูปไม่ได้
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Only image files are allowed",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/uploads/product-image"
}
```

503 — server ไม่ได้ config GCS (`GCS_PROJECT_ID`/`GCS_BUCKET`)
```json
{
  "statusCode": 503,
  "error": "ServiceUnavailableException",
  "message": "GCS_PROJECT_ID and GCS_BUCKET must be set to enable uploads",
  "timestamp": "2026-09-12T00:00:00.000Z",
  "path": "/api/v1/uploads/product-image"
}
```

> FE ควร handle `503` (เช่น fallback ให้ใส่ image URL เองหรือข้ามรูปไปก่อน)

---

## 10. Error Table รวม

| Case | HTTP | message |
|------|------|---------|
| `storeId` หายตอน create | 400 | `storeId is required` |
| validation fail (ชื่อว่าง/ราคาติดลบ) | 400 | array ของ class-validator messages |
| ไม่ใช่ owner ของ store | 400/403 | `User #... is not the owner of store #...` / `... does not have access to product #...` |
| station อยู่คนละ store | 400 | `Station #... does not belong to store #...` |
| category อยู่คนละ store | 400 | `Category #... does not belong to store #...` |
| store/station/category/product ไม่เจอ | 404 | `<Entity> #... not found` |
| ร้านไม่มีสินค้า (store list) | 404 | `No products found for store #...` |
| อัปโหลดไม่ใช่รูป/เกินขนาด | 400 | `Only image files are allowed` / `Image must be smaller than 50MB` |
| GCS ไม่ได้ config | 503 | `GCS_PROJECT_ID and GCS_BUCKET must be set to enable uploads` |

---

## 11. TypeScript Types สำหรับ FE

```ts
export type ProductView = {
  id: string;
  name: string;
  isActive: boolean;
  isBestSeller: boolean;
  price: number;
  cost: number | null;
  imageUrl: string | null;
  storeId: string | null;
  stationId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  stationName: string | null;
  createdAt: string;
  updatedAt: string;
};

// ทุก product ใน list/detail มี field นี้ (shape เต็มดู docs/api-modifiers.md)
export type ProductWithModifiersView = ProductView & {
  modifierGroups: ProductModifierGroupView[];
};

export type CreateProductPayload = {
  name: string;
  storeId: string;
  stationId: string;
  categoryId?: string;
  price: number;
  cost?: number;
  isBestSeller?: boolean;
  imageUrl?: string | null;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type UploadProductImageResponse = {
  imageUrl: string;
};
```

---

## 12. FE Checklist

- [ ] create ต้องส่ง `name` + `storeId` + `stationId` + `price` เสมอ (`categoryId` ไว้ทีหลังได้)
- [ ] `stationId`/`categoryId` ต้องเป็นของ store เดียวกับ `storeId` — ดึงจาก store เดียวกันเท่านั้น
- [ ] flow มีรูป: `POST /uploads/product-image` (multipart `file`) → เอา `imageUrl` ใส่ตอน create/update
- [ ] handle `503` จาก upload (GCS ไม่พร้อม) — fallback ใส่ URL เองหรือข้ามรูป
- [ ] เปลี่ยนรูปผ่าน PATCH แล้วรูปเก่าถูกลบอัตโนมัติ — ไม่ต้องยิงลบเอง
- [ ] หน้า POS/menu ใช้ `GET /products/store/:storeId` ครั้งเดียว (มี `modifierGroups` แล้ว ไม่ต้องยิง detail ต่อ)
- [ ] อย่าใช้ `GET /products` — ยังเป็น placeholder ยังไม่ใช้งาน
- [ ] `GET /products/restaurant/:id` ใช้ได้แต่เป็น legacy alias — โค้ดใหม่ใช้ `/store/:storeId`
- [ ] หมวดว่างคืน `[]` แต่ store ว่างคืน `404` — handle ต่างกัน
- [ ] `DELETE` คือลบจริง — ปิดขายชั่วคราวยังไม่มี `isActive` toggle ผ่าน API (ต้องรอ BE เพิ่ม field ลง Update DTO)
- [ ] เรื่อง modifier (assign group, selection, pricing): ดู `docs/api-modifiers.md`

---

## 13. FE Example

```ts
const BASE = 'http://localhost:3000/api/v1';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// 1. อัปโหลดรูป (JWT)
async function uploadProductImage(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/uploads/product-image`, {
    method: 'POST',
    headers: auth(token),
    body: form,
  });
  if (res.status === 503) throw new Error('Image upload unavailable, continue without image');
  if (!res.ok) throw await res.json();
  const json = await res.json();
  return json.data.imageUrl as string;
}

// 2. สร้างสินค้า (JWT)
type CreateProductPayload = {
  name: string;
  storeId: string;
  stationId: string;
  categoryId?: string;
  price: number;
  cost?: number;
  isBestSeller?: boolean;
  imageUrl?: string | null;
};

export async function createProduct(body: CreateProductPayload, token: string) {
  const res = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// 3. โหลด menu ทั้งร้านพร้อม modifiers (public)
export async function getStoreProducts(storeId: string) {
  const res = await fetch(`${BASE}/products/store/${storeId}`);
  if (!res.ok) throw await res.json();
  return res.json() as { success: true; data: ProductWithModifiersView[] };
}

// ใช้รวมกัน: อัปโหลดรูป -> สร้างสินค้า -> ผูก modifier group (ดู api-modifiers.md ข้อ 10)
const imageUrl = await uploadProductImage(file, token).catch(() => null);
await createProduct(
  { name: 'Americano', storeId: 'store00001', stationId: 'st00000001', price: 60, imageUrl },
  token,
);
const menu = await getStoreProducts('store00001');
```

cURL
```bash
TOKEN="<jwt>"
# อัปโหลดรูป
curl -X POST http://localhost:3000/api/v1/uploads/product-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/coffee.jpg"
# สร้างสินค้า
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Americano","storeId":"store00001","stationId":"st00000001","price":60}'
# โหลด menu ทั้งร้าน
curl http://localhost:3000/api/v1/products/store/store00001
# รายละเอียด + แก้ไข + ลบ
curl http://localhost:3000/api/v1/products/prod000001
curl -X PATCH http://localhost:3000/api/v1/products/prod000001 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"price":65}'
curl -X DELETE http://localhost:3000/api/v1/products/prod000001 \
  -H "Authorization: Bearer $TOKEN"
```
