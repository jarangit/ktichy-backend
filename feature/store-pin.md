# Store PIN API (FE Spec)

เอกสารนี้สำหรับฝั่ง FE เพื่อเรียก API Store PIN — ระบบ PIN ระดับร้านแบบ `write-before-settings` (บังคับตั้ง PIN ก่อนแก้ตั้งค่าร้าน และต้องส่ง PIN ทุกครั้งที่เขียน)

> Base prefix: `/api/v1` (`src/main.ts:12`)
> Response ถูกครอบด้วย `ResponseInterceptor` รูปแบบ `{ success, message, data }` เสมอ (`src/common/interceptor/response.interceptor.ts:12`)
> Validation: `ValidationPipe { whitelist: true, transform: true }` (`src/main.ts:19`) — field ที่ไม่อยู่ใน DTO จะถูก strip ออก
> PIN เก็บเป็น `pin_hash` แบบ bcrypt (`src/stores/entities/store.entity.ts:34`) ไม่เคยส่งกลับใน response

Base URL ตัวอย่าง
- Local: `http://localhost:3000`
- Full: `http://localhost:3000/api/v1/stores`

---

## 0. สรุป Flow สำหรับ FE

```
1. POST /stores              → สร้างร้าน (ต้องมี JWT user)
2. POST /stores/:id/pin     → ตั้ง PIN ครั้งแรก (4-6 หลัก, เจ้าของเท่านั้น)
3. PATCH /stores/:id        → แก้ settings/orderLimit ต้องส่ง pin ทุกครั้ง
   GET /stores/:id           → อ่านได้ปกติ ไม่ต้องใช้ PIN (write-only)
```

- ร้านเก่าที่ยังไม่มี PIN จะโดน block ที่ `PATCH` ด้วย `STORE_PIN_REQUIRED` จนกว่าจะเรียก `POST /:id/pin` ก่อน
- PIN เป็น per-request ไม่มี session/unlock token

---

## 1. POST /stores — สร้างร้าน

**Endpoint**
- Method: `POST`
- URL: `/api/v1/stores` (alias `/api/v1/restaurants` ใช้ได้เหมือนกัน)
- Auth: `Bearer <user JWT>` ✅ `JwtAuthGuard` (`src/stores/stores.controller.ts:22`)
- Controller: `src/stores/stores.controller.ts:22`
- Service: `src/stores/stores.service.ts:21`

**Request Body** `src/stores/dto/create-store.dto.ts:3`

| Field | Type | Required | Rule | Note |
|-------|------|----------|------|------|
| `name` | `string` | ✅ | `@IsNotEmpty()` | ชื่อร้าน |
| `userId` | `string` |  | `@IsOptional()` | backward compat — ถ้าส่งจะถูก ignore แล้วใช้ `req.user.sub` แทน |

> FE ควรส่งแค่ `name` — `owner_id` จะถูกดึงจาก JWT อัตโนมัติ (`src/stores/stores.service.ts:22`)

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "a1b2c3d4e5",
    "name": "My Kitchen",
    "owner_id": "u1a2b3c4d5",
    "orderLimit": 20,
    "settings": null,
    "createdAt": "2026-08-29T00:00:00.000Z",
    "updatedAt": "2026-08-29T00:00:00.000Z"
  }
}
```

**Error Response**

401 — ไม่ส่ง JWT
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/stores"
}
```

400 — `name` ว่าง
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["name should not be empty"],
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/stores"
}
```

**FE Example**

```ts
export async function createStore(name: string, token: string) {
  const res = await fetch('http://localhost:3000/api/v1/stores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw await res.json();
  return res.json() as { success: true; data: { id: string; name: string } };
}
```

---

## 2. POST /stores/:id/pin — ตั้ง PIN ครั้งแรก (first-time setup)

**Endpoint**
- Method: `POST`
- URL: `/api/v1/stores/:id/pin`
- Auth: `Bearer <user JWT>` ✅ ต้องเป็น owner ของร้าน (`src/stores/stores.controller.ts:28`)
- Controller: `src/stores/stores.controller.ts:28`
- Service: `src/stores/stores.service.ts:41` — hash ด้วย `bcrypt.hash(pin, 10)`
- DTO: `src/stores/dto/create-store-pin.dto.ts:3`

**Path Params**

| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | ✅ storeId (10-char nanoid) |

**Request Body**

| Field | Type | Required | Rule |
|-------|------|----------|------|
| `pin` | `string` | ✅ | `@Matches(/^\d{4,6}$/)` — ต้องเป็นตัวเลข 4–6 หลักเท่านั้น |

```json
{
  "pin": "1234"
}
```

**Success Response** `201 Created` — คืน store ที่ update แล้ว (ไม่มี `pinHash` เพราะ `select: false` + `@Exclude()`)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "a1b2c3d4e5",
    "name": "My Kitchen",
    "owner_id": "u1a2b3c4d5",
    "settings": null,
    "createdAt": "2026-08-29T00:00:00.000Z",
    "updatedAt": "2026-08-29T00:00:00.000Z"
  }
}
```

**Error Responses**

400 — PIN format ผิด
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["pin must be 4-6 digits"],
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/stores/a1b2c3d4e5/pin"
}
```

400 — มี PIN แล้ว (v1 ไม่อนุญาต overwrite ผ่าน endpoint นี้)
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": {
    "message": "Store PIN already set",
    "errorCode": "STORE_PIN_ALREADY_SET"
  },
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/stores/a1b2c3d4e5/pin"
}
```

400 — ไม่ใช่เจ้าของร้าน / ร้านไม่เจอ
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": {
    "message": "Store not found or you are not the owner",
    "errorCode": "STORE_NOT_FOUND"
  },
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/stores/unknown/pin"
}
```

401 — ไม่ส่ง JWT
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized"
}
```

**FE Example**

```ts
type SetPinPayload = { pin: string };

export async function setStorePin(storeId: string, pin: string, token: string) {
  const res = await fetch(`http://localhost:3000/api/v1/stores/${storeId}/pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ pin } as SetPinPayload),
  });
  if (!res.ok) {
    const err = await res.json();
    // err.message.errorCode === 'STORE_PIN_ALREADY_SET' | 'STORE_NOT_FOUND'
    throw err;
  }
  return res.json();
}

// ใช้
await setStorePin('a1b2c3d4e5', '1234', accessToken);
```

cURL
```bash
curl -X POST http://localhost:3000/api/v1/stores/a1b2c3d4e5/pin \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'
```

---

## 3. PATCH /stores/:id — แก้ตั้งค่าร้าน (ต้องส่ง PIN ทุกครั้ง)

**Endpoint**
- Method: `PATCH`
- URL: `/api/v1/stores/:id` (alias `/api/v1/restaurants/:id`)
- Auth: `Bearer <user JWT>` ✅ ต้องเป็น owner (`src/stores/stores.controller.ts:57`)
- Controller: `src/stores/stores.controller.ts:57`
- Service: `src/stores/stores.service.ts:98` — enforce PIN per-request
- DTO: `src/stores/dto/update-store.dto.ts:15`

**Path Params**

| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | ✅ |

**Request Body**

| Field | Type | Required | Rule | Note |
|-------|------|----------|------|------|
| `pin` | `string` | ✅* | `@Matches(/^\d{4,6}$/)` | *บังคับทุกครั้งที่ write — ไม่ถูก persist, ใช้ verify แล้ว strip ออก (`src/stores/stores.service.ts:112`) |
| `name` | `string` |  |  | เปลี่ยนชื่อร้าน |
| `orderLimit` | `number` |  | `@IsInt() @Min(1)` | |
| `settings` | `object` |  | `@ValidateNested()` → `StoreSettingsDto` | ดู schema ด้านล่าง |

> ถ้าร้านยังไม่มี `pin_hash` จะ error `STORE_PIN_REQUIRED` แม้จะส่ง `pin` มาก็ตาม — ต้องไปตั้ง PIN ก่อน (`src/stores/stores.service.ts:121`)

**StoreSettingsDto** `src/stores/dto/store-settings.dto.ts:73`

```ts
{
  hours?: string;
  promptpay?: string;
  dailyRevenueTarget?: string;
  paused?: boolean;
  sales?: { useTable?: boolean; useQueue?: boolean; useNote?: boolean; useOptions?: boolean; defaultType?: 'dineIn'|'togo' };
  payments?: { cash?: boolean; qr?: boolean; bank?: boolean; truemoney?: boolean };
  safety?: { confirmDelete?: boolean; confirmRefund?: boolean };
  delivery?: { supportedPlatforms?: string[]; enabledPlatforms?: string[] };
}
```

**Request Example** — แก้ settings ต้องแนบ PIN

```json
{
  "pin": "1234",
  "settings": {
    "promptpay": "0812345678",
    "sales": { "useTable": true },
    "payments": { "cash": true, "qr": true }
  }
}
```

```json
{
  "pin": "1234",
  "orderLimit": 30
}
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "a1b2c3d4e5",
    "name": "My Kitchen",
    "orderLimit": 30,
    "settings": {
      "promptpay": "0812345678",
      "sales": { "useTable": true }
    },
    "owner_id": "u1a2b3c4d5",
    "createdAt": "2026-08-29T00:00:00.000Z",
    "updatedAt": "2026-08-29T00:01:00.000Z"
  }
}
```

**Error Responses**

400 — ยังไม่ได้ตั้ง PIN (ร้านใหม่/ร้านเก่า)
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": {
    "message": "Store PIN must be set before updating settings",
    "errorCode": "STORE_PIN_REQUIRED"
  }
}
```

400 — ไม่ได้ส่ง PIN มาด้วย
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": {
    "message": "PIN is required for this operation",
    "errorCode": "STORE_PIN_REQUIRED"
  }
}
```

400 — PIN ผิด
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": {
    "message": "Invalid PIN",
    "errorCode": "INVALID_STORE_PIN"
  }
}
```

400 — PIN format ผิด (validation)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["pin must be 4-6 digits"]
}
```

400 — ไม่ใช่เจ้าของ
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Store not found or you are not the owner"
}
```

**FE Example**

```ts
type UpdateStorePayload = {
  pin: string; // 4-6 digits, required
  name?: string;
  orderLimit?: number;
  settings?: {
    promptpay?: string;
    sales?: { useTable?: boolean; useQueue?: boolean; useNote?: boolean; useOptions?: boolean; defaultType?: 'dineIn'|'togo' };
    payments?: { cash?: boolean; qr?: boolean; bank?: boolean; truemoney?: boolean };
    safety?: { confirmDelete?: boolean; confirmRefund?: boolean };
    delivery?: { supportedPlatforms?: string[]; enabledPlatforms?: string[] };
    paused?: boolean;
    hours?: string;
    dailyRevenueTarget?: string;
  };
};

type ApiError = {
  statusCode: number;
  message: { message: string; errorCode: string } | string | string[];
  error: string;
};

export async function updateStore(storeId: string, payload: UpdateStorePayload, token: string) {
  const res = await fetch(`http://localhost:3000/api/v1/stores/${storeId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    // handle by errorCode:
    // STORE_PIN_REQUIRED → พาไปหน้า "ตั้ง PIN" หรือให้กรอก PIN ใหม่
    // INVALID_STORE_PIN → แจ้ง PIN ผิด
    // STORE_NOT_FOUND → ร้านไม่เจอ/ไม่ใช่เจ้าของ
    throw err;
  }
  return res.json() as { success: true; data: any };
}

// ใช้
await updateStore('a1b2c3d4e5', { pin: '1234', settings: { promptpay: '0812345678' } }, token);
```

cURL
```bash
curl -X PATCH http://localhost:3000/api/v1/stores/a1b2c3d4e5 \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234","settings":{"promptpay":"0812345678","sales":{"useTable":true}}}'
```

---

## 4. Error Codes สรุป

| errorCode | ความหมาย | เกิดที่ | FE ควรทำ |
|-----------|----------|--------|----------|
| `STORE_PIN_REQUIRED` | ร้านยังไม่มี PIN หรือ request ไม่ส่ง PIN | `POST :id/pin` ไม่จำเป็น, `PATCH :id` | พาไปตั้ง PIN หรือเปิด dialog กรอก PIN |
| `INVALID_STORE_PIN` | PIN ไม่ตรงกับ hash | `PATCH :id` | แจ้ง "PIN ไม่ถูกต้อง" |
| `STORE_PIN_ALREADY_SET` | มี PIN แล้ว พยายามตั้งซ้ำ | `POST :id/pin` | แจ้งว่ามี PIN แล้ว (รอ `PATCH /pin` สำหรับเปลี่ยน PIN ในอนาคต) |
| `STORE_NOT_FOUND` | ร้านไม่เจอหรือไม่ใช่ owner | ทุก endpoint ที่ต้องใช้ owner | แจ้งสิทธิ์ไม่พอ |
| `FIND_STORE_FAILED` | fetch ล้มเหลว (wrapper error) | `GET :id` | แสดง generic error |

Validation errors (ไม่มี errorCode) จะมาเป็น array เช่น `["pin must be 4-6 digits"]`

---

## 5. FE Checklist

- [ ] `POST /stores` ส่งแค่ `{ name }` + `Authorization: Bearer <JWT>` (ไม่ต้องส่ง `userId`)
- [ ] หลังสร้างร้านเสร็จ พาไปหน้า "ตั้ง PIN" ทันที — เรียก `POST /stores/:id/pin` ด้วย PIN 4-6 หลัก
- [ ] เก็บ PIN ใน memory ชั่วคราวเท่านั้น ห้ามเก็บลง localStorage ถาวร (per-request model)
- [ ] ทุก `PATCH /stores/:id` ต้องแนบ `pin` มาด้วย — ถ้าลืมจะได้ `STORE_PIN_REQUIRED`
- [ ] Handle `STORE_PIN_REQUIRED` → เปิด modal กรอก PIN หรือ redirect ไปตั้ง PIN
- [ ] Handle `INVALID_STORE_PIN` → แจ้ง PIN ผิด + ให้กรอกใหม่
- [ ] Handle `STORE_PIN_ALREADY_SET` → ไม่ต้องเรียก `POST :id/pin` ซ้ำ
- [ ] PIN เป็น `string` ที่ match `/^\d{4,6}$/` — validate ฝั่ง FE ก่อนยิง
- [ ] `pin` จะไม่ถูกบันทึกเป็น field ของ store และไม่กลับมาใน response
- [ ] `GET /stores/:id` ยังเรียกได้ปกติโดยไม่ต้องใช้ PIN (read ไม่ถูก block)

---

## 6. TypeScript Types สำหรับ FE

```ts
export type Store = {
  id: string;
  name: string;
  owner_id: string;
  orderLimit: number;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type SetStorePinPayload = { pin: string }; // /^\d{4,6}$/
export type UpdateStorePayload = {
  pin: string; // required for every PATCH
  name?: string;
  orderLimit?: number;
  settings?: {
    hours?: string;
    promptpay?: string;
    dailyRevenueTarget?: string;
    paused?: boolean;
    sales?: { useTable?: boolean; useQueue?: boolean; useNote?: boolean; useOptions?: boolean; defaultType?: 'dineIn' | 'togo' };
    payments?: { cash?: boolean; qr?: boolean; bank?: boolean; truemoney?: boolean };
    safety?: { confirmDelete?: boolean; confirmRefund?: boolean };
    delivery?: { supportedPlatforms?: string[]; enabledPlatforms?: string[] };
  };
};

export type ApiSuccess<T> = { success: true; message: string; data: T };
export type ApiError = {
  statusCode: number;
  error: string;
  message: { message: string; errorCode: 'STORE_PIN_REQUIRED' | 'INVALID_STORE_PIN' | 'STORE_PIN_ALREADY_SET' | 'STORE_NOT_FOUND' | 'FIND_STORE_FAILED' } | string | string[];
  timestamp: string;
  path: string;
};
```

---

## 7. Migration / Backward Compat

- Migration: `src/db/migrations/1786000000001-add-store-pin-hash.ts` เพิ่มคอลัมน์ `store.pin_hash` nullable — ร้านเก่าจะมีค่า `NULL`
- ร้านเก่า `pin_hash = NULL` → `PATCH` จะตอบ `STORE_PIN_REQUIRED` จนกว่าจะตั้ง PIN ครั้งแรก
- Entity: `src/stores/entities/store.entity.ts:34` — `pinHash` เป็น `select: false` + `@Exclude()` จึงไม่รั่วใน `GET`

---

## 8. สิ่งที่ยังไม่ทำ (v1 Scope)

- ไม่มี `PATCH /stores/:id/pin` สำหรับเปลี่ยน PIN (ต้อง verify PIN เก่า) — ถ้า FE ต้องการให้แจ้ง จะเพิ่มเป็น v2
- ไม่มี `POST /stores/:id/pin/verify` แยกสำหรับเช็ค PIN ก่อนเข้า settings — v1 ใช้ `PATCH` เป็นตัว verify ไปเลย
- ไม่ block `GET` — read ยังได้ปกติตาม JWT (`write-only` ตาม requirement)
