# Domain Model — Kitchy Backend

Kitchy = KDS backend สำหรับร้านอาหาร
Store = boundary หลัก ทุกข้อมูลร้านอยู่ใต้ Store
PK ทั้งหมด = nanoid 10-char (`src/utils/nanoid.ts`)

## Entity Map

```text
User -> Store -> Station -> Product
                         -> OrderStationItem
                         -> Device
                         -> PairingCode
              -> Category -> Product
              -> Product
              -> Order -> OrderItem -> OrderStationItem
                       -> Payment
              -> Device
              -> PairingCode / PairingRequest
              -> QuickNote
UserIdentity = stub ยังไม่ใช้
```

## Entities

### User — เจ้าของร้าน / account login

- ไฟล์: `src/users/entities/user.entity.ts`
- หน้าที่: auth, เป็น owner ของ Store
- Field: `id, email?, username(unique), phoneNumber?, passwordHash(hidden), status`
- Status: `ACTIVE | BLOCKED`
- Relation: `1:N -> Store` ผ่าน `owner_id`
- Rule: `passwordHash` ไม่ส่งออก response

### UserIdentity — stub ยังไม่ implement

- ไฟล์: `src/user_identities/entities/user_identity.entity.ts`
- สถานะ: class เปล่า ไม่มี `@Entity()`
- เจตนา: เก็บ login ภายนอก (google/facebook/phone) + unique `(provider, provider_user_id)`
- ห้ามอ้างใน logic ตอนนี้

### Store — ร้าน/สาขา aggregate root

- ไฟล์: `src/stores/entities/store.entity.ts`
- หน้าที่: boundary ข้อมูลร้าน, config, PIN
- Field: `id, name, orderLimit(default 20), settings(json?), pinHash(hidden)`
- Relation:
  - `N:1 -> User` ผ่าน `owner_id`
  - `1:N -> Station, Product, Category, Order, QuickNote`
- Rule:
  - สร้างต้องมี JWT, owner = `req.user.sub`
  - แก้ settings/orderLimit ต้องส่ง PIN ทุกครั้ง
  - ร้านเก่าไม่มี PIN โดน block `STORE_PIN_REQUIRED`

### Station — สถานีครัว (grill/drinks/dessert)

- ไฟล์: `src/stations/entities/station.entity.ts`
- หน้าที่: จุดทำงานในครัว, ปลายทางจอ KDS
- Field: `id, storeId, name, color`
- Relation:
  - `N:1 -> Store`
  - `1:N -> Product, OrderStationItem, Device`
  - `1:1 -> PairingCode`
- Rule: ลบ Store/Station cascade ไป Product/OrderStationItem

### Category — หมวดเมนู

- ไฟล์: `src/category/entities/category.entity.ts`
- หน้าที่: จัดกลุ่มเมนู + เรียงแสดงผล
- Field: `id, storeId(implicit via relation), name, isActive(default true), sortOrder(default 0)`
- Relation: `N:1 -> Store`, `1:N -> Product`
- Rule: soft delete = `isActive=false`, ลบ Store cascade

### Product — เมนู/สินค้า

- ไฟล์: `src/products/entities/product.entity.ts`
- หน้าที่: สินค้าที่สั่งได้ ผูก station เพื่อ route งานครัว
- Field: `id, name, price(decimal), cost?, isBestSeller, imageUrl?, isActive(default true)`
- Relation: `N:1 -> Store, Station?, Category?`, `1:N -> ProductModifierGroup`
- Rule: ลบ Category = `SET NULL`, ลบ Store/Station = cascade

### ModifierGroup / ModifierOption / ProductModifierGroup — ตัวเลือกเพิ่มเติมของสินค้า

- ไฟล์: `src/modifiers/entities/`
- หน้าที่: generic modifier (Size/Sweetness/Doneness/...) โดยไม่ต้องเพิ่ม column ลง Product
- Field (group): `id, name, selectionType(SINGLE|MULTIPLE), minSelect, maxSelect, isActive`
- Field (option): `id, name, priceAdjustment(decimal), sortOrder, isAvailable`
- Field (junction): `id, sortOrder`, unique `(productId, modifierGroupId)`
- Relation: `Store 1:N ModifierGroup 1:N ModifierOption`, `Product 1:N ProductModifierGroup N:1 ModifierGroup`
- Rule: reuse ได้เฉพาะใน store เดียวกัน, DELETE = soft deactivate, product detail/list endpoints คืนเฉพาะ active/available ใน `modifierGroups`
- Note: Order snapshot เก็บใน `order_item_modifier`; `POST /orders` รับ `products[].modifiers[]` แล้ว

### Order — ออเดอร์หนึ่งใบ

- ไฟล์: `src/orders/entities/order.entity.ts`
- หน้าที่: คำสั่งซื้อ + สถานะรวม
- Field: `id, orderNumber, status, orderType, tableNumber?, customerName?, deliveryPlatform?, deliveryOrderNumber?, isWaitingInStore, isArchived`
- Status: `NEW -> PREPARING -> READY -> COMPLETED | CANCELLED`
- Type: `DINE_IN | TOGO | DELIVERY`
- Relation: `N:1 -> Store`, `1:N -> OrderItem, Payment`
- Rule: cascade ไป OrderItem

### OrderItem — บรรทัดสินค้าในบิล

- ไฟล์: `src/orders/entities/order-item.entity.ts`
- หน้าที่: snapshot สินค้า ณ เวลาสั่ง
- Field: `id, status(NEW|PREPARING|READY), name, price, quantity, notes?`
- Relation: `N:1 -> Order, Product`, `1:N -> OrderStationItem`
- Rule: เก็บ `name/price` ซ้ำจาก Product กันเมนูเปลี่ยนราคาย้อนหลัง

### OrderStationItem — งานย่อยบนจอครัว

- ไฟล์: `src/order-station-item/entities/order-station-item.entity.ts`
- หน้าที่: work item ที่ station ต้องทำ = หัวใจ KDS
- Field: `id, status`
- Status: `pending -> complete -> served` (lowercase ต่างจาก Order)
- Relation: `N:1 -> OrderItem, Station`
- Rule: 1 OrderItem แตกได้หลาย StationItem ตาม station ของ Product

### Payment — การจ่ายเงิน

- ไฟล์: `src/payments/entities/payment.entity.ts`
- หน้าที่: เงิน, ใบเสร็จ, token รับใบเสร็จ
- Field: `id, method, amount, receivedAmount?, change?, receiptId, receiptToken(unique), receiptExpiresAt, status`
- Method: `CASH | QR | DELIVERY_PLATFORM`
- Status: `PAID | REFUNDED`
- Relation: `N:1 -> Order, Store`
- Rule: `receiptId` มัก = `orderNumber`, `receiptToken` unique สำหรับดึงใบเสร็จ

### Device — จอ KDS จริง

- ไฟล์: `src/devices/entities/device.entity.ts`
- หน้าที่: hardware แสดงคิว station
- Field: `id, deviceId(unique 64), storeId?, stationId?, alias?, deviceName?, fingerprint?, appVersion?, status, lastSeenAt?`
- Status: `UNPAIRED | PENDING | PAIRED | DISABLED`
- Relation: `N:1 -> Store?, Station?`
- Rule: ลบ Store cascade, ลบ Station = `SET NULL`
- Note: มีทั้ง relation + explicit column `store_id/station_id` คู่กัน เสี่ยง duplicate mapping

### PairingCode — code จับคู่อุปกรณ์

- ไฟล์: `src/pairing-codes/entities/pairing-code.entity.ts`
- หน้าที่: code ชั่วคราวให้ device join ร้าน/station
- Field: `id, storeId, stationId?, code(unique 32), status, expiresAt?, createdBy`
- Status: `PENDING -> EXPIRED | CLOSED`
- Relation: `N:1 -> Store`, `1:1 -> Station?`

### PairingRequest — คำขอจับคู่

- ไฟล์: `src/pairing-requests/entities/pairing-request.entity.ts`
- หน้าที่: device ขอเข้า -> owner อนุมัติ
- Field: `id, pairingCodeId, storeId, stationId?, deviceId, requestedAlias?, requestedFingerprint?, requestedAppVersion?, status, approvedBy?, approvedAt?, expiresAt?`
- Status: `WAITING_APPROVAL | APPROVED | REJECTED | EXPIRED | CANCELLED`
- Relation: `N:1 -> PairingCode, Store, Station?, Device`
- Rule: flow ปัจจุบัน partial, approve endpoint orphaned

### QuickNote — note สั้นระดับร้าน

- ไฟล์: `src/quick-note/entities/quick-note.entity.ts`
- หน้าที่: ข้อความลัด เช่น ไม่ใส่น้ำแข็ง/เผ็ดน้อย
- Field: `id, text(<=60), sortOrder`
- Relation: `N:1 -> Store`
- Rule: PUT bulk replace ทั้งชุดของ store

## Business Flows

- Register/Login: `POST /users/register` ต้องมี `password` + (`email`|`phoneNumber`), ได้ `access_token`
- Store setup: `POST /stores` -> `POST /stores/:id/pin` (4-6 หลัก) -> `PATCH /stores/:id` ต้องส่ง pin ทุกครั้ง
- Menu setup: Store -> Category -> Station -> Product(ผูก `stationId`+`categoryId`)
- Order: Order(+items snapshot) -> แตก OrderStationItem ตาม station -> Station ทำ `pending->complete->served` -> Order `NEW->PREPARING->READY->COMPLETED`
- Payment: Order `1:N` Payment, Transaction = view `Order+payments[0]`
- Device: PairingCode -> Device join -> PAIRED -> ผูก Station -> แสดงคิว OrderStationItem
- PIN: write-only, ไม่มี session, ไม่คืน `pinHash`

## Status Lifecycle

```text
Order: NEW -> PREPARING -> READY -> COMPLETED
       NEW/PREPARING -> CANCELLED
OrderItem: NEW -> PREPARING -> READY
OrderStationItem: pending -> complete -> served
Payment: PAID -> REFUNDED
Device: UNPAIRED -> PENDING -> PAIRED -> DISABLED
PairingCode: PENDING -> EXPIRED | CLOSED
PairingRequest: WAITING_APPROVAL -> APPROVED|REJECTED|EXPIRED|CANCELLED
User: ACTIVE | BLOCKED
```

## Known Gaps

- `UserIdentity` = stub ใช้ไม่ได้
- Pairing flow partial: create/join auto-PAIRED, ไม่มีใครสร้าง PairingRequest
- `README.md` ยังเป็น Nest starter ไม่ใช่ project doc
- Ownership guard ไม่ครบ: stores/stations/products write ยังขาด store-owner check
- `Device` มี relation + explicit FK column ซ้อนกัน เสี่ยง TypeORM mapping ผิด
- `Station.pairingCodes` ชื่อพหูพจน์แต่เป็น `OneToOne`
- `synchronize:false` — schema เปลี่ยนต้องผ่าน migration เท่านั้น
- `nanoid` ใช้ `Math.random()` ไม่ใช่ CSPRNG
