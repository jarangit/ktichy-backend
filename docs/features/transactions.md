# transactions — view Order+Payment
- ไม่มี entity ของตัวเอง เป็น read view
- controller/service: `src/transactions/`

## Endpoints (ปัจจุบันไม่มี guard)
- `GET /transactions?storeId=&flowStatus=&search=&orderType=&method=&startDate=&endDate=`
- `GET /transactions/counts` — query ชุดเดียวกับ list
- `GET /transactions/:id`
- `PATCH /transactions/:id` — แก้ note/qty ของ item (`note` เอกพจน์)

## Rule
- `flowStatus: ALL|IN_PROGRESS(NEW,PREPARING)|DONE(READY,COMPLETED)|CANCELLED`
- `method/amount` มาจาก `payments[0]`, ไม่มี payment = null
- detail ดู `../api-transactions.md`
