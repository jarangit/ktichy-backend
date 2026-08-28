# Transactions API (FE Spec)

เอกสารนี้สำหรับฝั่ง FE เพื่อเรียก API Transactions (view ของ Order + Payment) หลัง refactor ล่าสุด

> Base prefix: `/api/v1` (ตั้งใน `src/main.ts:12`)
> Response ถูกครอบด้วย `ResponseInterceptor` รูปแบบ `{ success, message, data }` เสมอ `src/common/interceptor/response.interceptor.ts:15`
> Validation: `ValidationPipe { whitelist: true, transform: true }` `src/main.ts:19` — field ที่ไม่อยู่ใน DTO จะถูก strip ออก

Base URL ตัวอย่าง
- Local: `http://localhost:3000`
- Full: `http://localhost:3000/api/v1/transactions`

---

## 1. Enums

**OrderStatus** `src/orders/entities/order.entity.ts:17`
```
NEW | PREPARING | READY | COMPLETED | CANCELLED
```

**OrderType** `src/orders/entities/order.entity.ts:25`
```
DINE_IN | TOGO | DELIVERY
```

**PaymentMethod** `src/payments/entities/payment.entity.ts:15`
```
CASH | QR | DELIVERY_PLATFORM
```

**FlowStatus** (derived, ใช้ filter ฝั่ง list/counts) `src/transactions/transactions.service.ts:49`
```
ALL | IN_PROGRESS | DONE | CANCELLED
  IN_PROGRESS = NEW, PREPARING
  DONE        = READY, COMPLETED
  CANCELLED   = CANCELLED
```

**Timezone**: BE/DB ล็อกเป็น `Asia/Bangkok` (`docker-compose.yml:8`, `src/app.module.ts:36` `timezone: '+07:00'`) — FE แสดงเวลาไทยได้เลย ไม่ต้องแปลงเพิ่ม แต่ถ้า parse เป็น `Date` ให้ใช้ `Asia/Bangkok`

---

## 2. GET /transactions — รายการ transactions ของ store

**Endpoint**
- Method: `GET`
- URL: `/api/v1/transactions`
- Auth: `none` (ปัจจุบัน `TransactionsController` ยังไม่ใส่ `JwtAuthGuard`)
- Controller: `src/transactions/transactions.controller.ts:11`

**Query Params** `src/transactions/dto/get-transactions-query.dto.ts:11`

| Field | Type | Required | Rule | Note |
|-------|------|----------|------|------|
| `storeId` | `string` | ✅ | `@IsNotEmpty()` | id ของ store (10-char nanoid) |
| `flowStatus` | `enum` |  | `ALL\|IN_PROGRESS\|DONE\|CANCELLED` | filter ตามสถานะ derived |
| `search` | `string` |  |  | contains บน `orderNumber` case-insensitive `src/transactions/transactions.service.ts:77` |
| `orderType` | `enum` |  | `DINE_IN\|TOGO\|DELIVERY` | ไม่ส่ง = ไม่กรอง (ไม่มีค่า `ALL` สำหรับ field นี้) |
| `method` | `enum` |  | `CASH\|QR\|DELIVERY_PLATFORM` | กรองตาม `payment.method` ตัวแรกของ order |
| `status` | `string` |  |  | legacy — กรองตรง `order.status` |
| `startDate` | `string` |  | `@IsDateString()` ISO8601 | กรอง `createdAt >= startDate` |
| `endDate` | `string` |  | `@IsDateString()` ISO8601 | กรอง `createdAt <= endDate` |

> ห้ามส่ง `dateRange` — ให้ใช้คู่ `startDate`/`endDate` เท่านั้น
> `counts` ใช้ query ชุดเดียวกับ list เพื่อให้จำนวนตรงกับรายการที่กรองแล้ว

**Success Response** `200 OK` — `TransactionView[]` `src/transactions/transactions.service.ts:7`

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "abc1234567",
      "orderId": "abc1234567",
      "orderNumber": "A-001",
      "storeId": "store00001",
      "status": "READY",
      "type": "DINE_IN",
      "orderType": "DINE_IN",
      "tableNumber": "T1",
      "customerName": null,
      "deliveryPlatform": null,
      "deliveryOrderNumber": null,
      "isWaitingInStore": false,
      "method": "QR",
      "receiptId": "A-001",
      "amount": 100,
      "totalAmount": 100,
      "servedItemCount": 2,
      "totalItemCount": 2,
      "items": [
        {
          "id": "i1",
          "productId": "p1",
          "name": "Coffee",
          "price": 50,
          "quantity": 2,
          "total": 100,
          "note": null
        }
      ],
      "products": [
        {
          "id": "i1",
          "productId": "p1",
          "name": "Coffee",
          "price": 50,
          "quantity": 2,
          "total": 100,
          "note": null
        }
      ],
      "createdAt": "2026-08-18T10:00:00.000Z",
      "updatedAt": "2026-08-18T10:00:00.000Z"
    }
  ]
}
```

Field notes:
- `type` = alias ของ `orderType` เพื่อ backward-compat — ใช้ `orderType` เป็นหลัก
- `method`/`receiptId`/`amount` มาจาก `payments[0]` ถ้าไม่มี payment จะเป็น `null` และ `totalAmount` จะคำนวณจาก `items`
- `products` = alias ของ `items` (shape เดียวกัน)
- `items[].note` มาจาก `orderItem.notes` — FE ต้องส่ง `note` (เอกพจน์) ตอน PATCH

**Error Response**

400 — `storeId` missing
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["storeId should not be empty"],
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions"
}
```

400 — `startDate` ไม่ใช่ ISO
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["startDate must be a valid ISO 8601 date string"],
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions"
}
```

400 — `orderType`/`method`/`flowStatus` ไม่ตรง enum
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["orderType must be one of the following values: DINE_IN, TOGO, DELIVERY"],
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions"
}
```

**FE Example**

```ts
type GetTransactionsQuery = {
  storeId: string;
  flowStatus?: 'ALL' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  search?: string;
  orderType?: 'DINE_IN' | 'TOGO' | 'DELIVERY';
  method?: 'CASH' | 'QR' | 'DELIVERY_PLATFORM';
  status?: string;
  startDate?: string; // ISO
  endDate?: string;   // ISO
};

export async function getTransactions(q: GetTransactionsQuery) {
  const params = new URLSearchParams(q as Record<string, string>);
  const res = await fetch(`http://localhost:3000/api/v1/transactions?${params}`);
  if (!res.ok) throw await res.json();
  return res.json() as { success: true; data: TransactionView[] };
}

// ต้องการทั้งหมด ไม่ต้องส่ง orderType
getTransactions({ storeId: 's1' });
// กรองเฉพาะ DINE_IN + QR + ค้นหาเลขบิล + ช่วงวันที่
getTransactions({
  storeId: 's1',
  search: 'A-00',
  orderType: 'DINE_IN',
  method: 'QR',
  flowStatus: 'IN_PROGRESS',
  startDate: '2026-08-18T00:00:00.000Z',
  endDate: '2026-08-19T00:00:00.000Z',
});
```

cURL
```bash
curl "http://localhost:3000/api/v1/transactions?storeId=s1&orderType=DINE_IN&method=QR&search=A-00&flowStatus=IN_PROGRESS&startDate=2026-08-18T00:00:00.000Z&endDate=2026-08-19T00:00:00.000Z"
```

---

## 3. GET /transactions/counts — จำนวนตาม flowStatus (ใช้ filter เดียวกับ list)

**Endpoint**
- Method: `GET`
- URL: `/api/v1/transactions/counts`
- Auth: `none`
- Controller: `src/transactions/transactions.controller.ts:17`

**Query Params** `src/transactions/dto/get-transaction-counts-query.dto.ts:11` — ชุดเดียวกับ `GET /transactions` ทั้งหมด

| Field | Required | Note |
|-------|----------|------|
| `storeId` | ✅ | |
| `flowStatus`, `search`, `orderType`, `method`, `status`, `startDate`, `endDate` |  | ถ้าส่ง จะนับเฉพาะรายการที่ match filter นั้น — ต้องส่งชุดเดียวกับ list เพื่อให้ badge ตรงกับ list `src/transactions/transactions.service.ts:235` |

**Success Response** `200 OK` — `TransactionCountsView` `src/transactions/transactions.service.ts:42`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "all": 12,
    "inProgress": 5,
    "done": 6,
    "cancelled": 1
  }
}
```

**FE Example**

```ts
export async function getTransactionCounts(q: GetTransactionsQuery) {
  const params = new URLSearchParams(q as Record<string, string>);
  const res = await fetch(`http://localhost:3000/api/v1/transactions/counts?${params}`);
  if (!res.ok) throw await res.json();
  return res.json() as { success: true; data: { all: number; inProgress: number; done: number; cancelled: number } };
}

// counts ต้องใช้ filter เดียวกับ list
const listQuery = { storeId: 's1', search: 'A-00', orderType: 'DINE_IN' as const };
const [list, counts] = await Promise.all([
  getTransactions(listQuery),
  getTransactionCounts(listQuery),
]);
// counts.all === list.data.length เสมอ
```

cURL
```bash
curl "http://localhost:3000/api/v1/transactions/counts?storeId=s1&search=A-00&orderType=DINE_IN&method=QR"
```

---

## 4. GET /transactions/:id — รายละเอียด 1 รายการ

**Endpoint**
- Method: `GET`
- URL: `/api/v1/transactions/:id`
- Auth: `none`
- Controller: `src/transactions/transactions.controller.ts:23`

**Path Params**
| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | ✅ orderId / transaction id |

**Success Response** `200 OK` — `TransactionView` เดียว (shape เดียวกับข้อ 2)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "abc1234567",
    "orderNumber": "A-001",
    "status": "READY",
    "orderType": "DINE_IN",
    "totalAmount": 100,
    "items": []
  }
}
```

**Error Response** `404`
```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Transaction #abc1234567 not found",
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions/abc1234567"
}
```

---

## 5. PATCH /transactions/:id — แก้ไข transaction (จำกัด field)

**Endpoint**
- Method: `PATCH`
- URL: `/api/v1/transactions/:id`
- Auth: `none`
- Controller: `src/transactions/transactions.controller.ts:28`
- DTO: `src/transactions/dto/update-transaction.dto.ts:13`
- Service: `src/transactions/transactions.service.ts:267` → delegate ไป `OrdersService.update()` `src/orders/orders.service.ts:151`

**Path Params**
| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | ✅ |

**Request Body** — ส่งได้แค่ 3 fields นี้เท่านั้น (field อื่นจะถูก strip โดย `whitelist: true`)

| Field | Type | Required | Rule |
|-------|------|----------|------|
| `status` | `enum` |  | `NEW\|PREPARING\|READY\|COMPLETED\|CANCELLED` `src/orders/entities/order.entity.ts:17` |
| `tableNumber` | `string` |  |  |
| `products` | `array` |  | `ArrayMinSize(1)` + `ValidateNested` — แต่ละ item `src/orders/dto/create-order.dto.ts:15` |

**products[] item**
| Field | Type | Required | Rule |
|-------|------|----------|------|
| `productId` | `string` | ✅ | `@IsNotEmpty()` |
| `quantity` | `number` | ✅ | `@IsInt() @Min(1)` |
| `note` | `string` |  | optional — ต้องเป็น `note` เอกพจน์ ไม่ใช่ `notes` |

> ถ้าส่ง `products` ต้องมีอย่างน้อย 1 item — ส่ง `[]` จะโดน `400` (`src/transactions/dto/update-transaction.dto.ts:24` + guard `src/orders/orders.service.ts:169`)
> ถ้าไม่ต้องการแก้สินค้า ให้ omit `products` ไปเลย
> ห้ามส่ง `storeId`, `orderNumber`, `orderType`, `customerName`, `deliveryPlatform` ใน endpoint นี้

**Request Examples**

เปลี่ยนสถานะอย่างเดียว
```json
{
  "status": "PREPARING"
}
```

เปลี่ยนโต๊ะ
```json
{
  "tableNumber": "A12"
}
```

แก้สินค้าทั้งบิล (replace)
```json
{
  "status": "PREPARING",
  "tableNumber": "A12",
  "products": [
    { "productId": "p1", "quantity": 2, "note": "less ice" },
    { "productId": "p2", "quantity": 1 }
  ]
}
```

**Success Response** `200 OK` — `TransactionView` หลังแก้ไข

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "abc1234567",
    "orderNumber": "A-001",
    "status": "PREPARING",
    "tableNumber": "A12",
    "totalAmount": 100,
    "items": [
      { "id": "i1", "productId": "p1", "name": "Coffee", "price": 50, "quantity": 2, "total": 100, "note": "less ice" }
    ]
  }
}
```

**Error Response**

400 — products ว่าง
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "products must contain at least one item when provided",
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions/abc1234567"
}
```

400 — validation fail
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["products must contain at least 1 elements", "quantity must not be less than 1"],
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions/abc1234567"
}
```

404 — ไม่เจอ order
```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Order #abc1234567 not found",
  "timestamp": "2026-08-29T00:00:00.000Z",
  "path": "/api/v1/transactions/abc1234567"
}
```

**FE Example**

```ts
type UpdateTransactionDto = {
  status?: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  tableNumber?: string;
  products?: { productId: string; quantity: number; note?: string }[];
};

export async function updateTransaction(id: string, body: UpdateTransactionDto) {
  const res = await fetch(`http://localhost:3000/api/v1/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ใช้
await updateTransaction('abc1234567', { status: 'READY' });
await updateTransaction('abc1234567', { tableNumber: 'A12', products: [{ productId: 'p1', quantity: 2, note: 'less ice' }] });
```

cURL
```bash
curl -X PATCH http://localhost:3000/api/v1/transactions/abc1234567 \
  -H "Content-Type: application/json" \
  -d '{"status":"PREPARING","tableNumber":"A12","products":[{"productId":"p1","quantity":2,"note":"less ice"}]}'
```

---

## 6. Breaking Changes / FE Checklist

- [ ] เลิกส่ง `dateRange` — ใช้ `startDate`/`endDate` ISO แทน
- [ ] เลิกส่ง `type` — ใช้ `orderType` (`DINE_IN`/`TOGO`/`DELIVERY`) `src/transactions/transactions.service.ts:160`
- [ ] `search` จะ match `orderNumber` แบบ contains เท่านั้น
- [ ] `products[].note` ต้องเป็น `note` เอกพจน์
- [ ] `GET /transactions/counts` ต้องส่ง filter ชุดเดียวกับ `GET /transactions` เสมอ
- [ ] `PATCH` ส่งได้แค่ `status`/`tableNumber`/`products` — field อื่นจะถูก strip
- [ ] `products: []` จะ error — ถ้าไม่แก้สินค้าให้ omit field
- [ ] เวลา `createdAt`/`updatedAt` เป็น `Asia/Bangkok` แล้ว — แสดงได้เลย

---

## 7. TypeScript Types สำหรับ FE

```ts
export type TransactionView = {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId?: string;
  status: string;
  type?: string; // deprecated, use orderType
  orderType?: 'DINE_IN' | 'TOGO' | 'DELIVERY';
  tableNumber?: string | null;
  customerName?: string | null;
  deliveryPlatform?: string | null;
  deliveryOrderNumber?: string | null;
  isWaitingInStore?: boolean;
  method?: 'CASH' | 'QR' | 'DELIVERY_PLATFORM' | null;
  receiptId?: string | null;
  amount?: number | null;
  totalAmount: number;
  servedItemCount: number;
  totalItemCount: number;
  items: { id: string; productId?: string; name?: string; price: number; quantity: number; total: number; note: string | null }[];
  products: TransactionView['items'];
  createdAt: string;
  updatedAt: string;
};

export type TransactionCountsView = {
  all: number;
  inProgress: number;
  done: number;
  cancelled: number;
};
```
