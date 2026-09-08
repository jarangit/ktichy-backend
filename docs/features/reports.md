# reports — รายงานยอดขาย
- controller/service: `src/reports/`

## Endpoints
- `GET /reports?storeId=&startDate=&endDate=&preset=` — รวมยอดจาก Order+Payment
- preset: `today|week|month` (ถ้ามี)

## Rule
- อ่านอย่างเดียว ไม่เปลี่ยนข้อมูล
- timezone ดู `../prod-timezone-runbook.md`
