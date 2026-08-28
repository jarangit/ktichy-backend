# Production Timezone Runbook

ใช้เอกสารนี้เมื่อเวลา `createdAt` / `updatedAt` ของ order ใน production เหลื่อม `-7 ชั่วโมง`

## 1. ตรวจ timezone ปัจจุบันของ DB

```sql
SELECT @@system_time_zone, @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP();
```

ถ้า `NOW()` ไม่ตรงกับเวลาธุรกิจที่คาดหวัง ให้แก้ที่ DB/server timezone ก่อน

## 2. สร้าง order ทดสอบ 1 รายการ

- ใช้ `orderNumber` ที่หาเจอง่าย เช่น `TZ-CHECK-001`
- จดเวลาจริงตอนกดสร้าง

## 3. ตรวจข้อมูลใน DB

```sql
SELECT id, orderNumber, createdAt, updatedAt
FROM `order`
WHERE orderNumber = 'TZ-CHECK-001';

SELECT oi.id, oi.createdAt, oi.updatedAt
FROM order_item oi
JOIN `order` o ON o.id = oi.orderId
WHERE o.orderNumber = 'TZ-CHECK-001';

SELECT p.id, p.createdAt, p.updatedAt
FROM payment p
JOIN `order` o ON o.id = p.orderId
WHERE o.orderNumber = 'TZ-CHECK-001';
```

## 4. ตรวจ API

```bash
curl "https://<host>/api/v1/orders/<orderId>"
curl "https://<host>/api/v1/transactions/<orderId>"
```

ถ้า DB ถูก แต่ API เพี้ยน ให้ตรวจ app timezone config (`DB_TIMEZONE`) และ client-side formatting

## 5. ตั้ง app timezone แบบ explicit เฉพาะกรณีจำเป็น

- ปล่อย `DB_TIMEZONE` ว่างไว้เป็น default ก่อน
- ถ้าต้อง force session timezone ของ MySQL ค่อยตั้ง:

```env
DB_TIMEZONE=+07:00
```

## 6. Backfill ข้อมูลเก่าแบบระวัง

ตัวอย่างกรณีข้อมูลเก่าถูกเก็บเป็น UTC แต่ธุรกิจต้องการเวลาไทย:

```sql
UPDATE `order`
SET createdAt = DATE_ADD(createdAt, INTERVAL 7 HOUR),
    updatedAt = DATE_ADD(updatedAt, INTERVAL 7 HOUR)
WHERE createdAt >= '2026-08-01 00:00:00'
  AND createdAt < '2026-08-29 04:09:00';
```

ทำแบบเดียวกันกับ `order_item` และ `payment` โดยตรวจความสัมพันธ์กับ `order.createdAt` ก่อนทุกครั้ง

## 7. ข้อห้าม

- อย่าแปลง `Date` ทุก response globally เพื่อแก้ timezone production
- อย่า backfill ทั้งตารางโดยไม่มีช่วงเวลา/เงื่อนไขที่ตรวจสอบแล้ว
- อย่าเดา timezone จากฝั่ง FE อย่างเดียว ต้องเทียบกับ DB เสมอ
