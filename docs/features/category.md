# category — หมวดเมนู
- entity: `Category` (`src/category/entities/category.entity.ts`)
- controller: `src/category/category.controller.ts` base `category` (JWT ทั้งหมด)

## Endpoints
- `POST /category` — `{ storeId, name, sortOrder? }`
- `GET /category`, `GET /category/store/:storeId`, `GET /category/:id`
- `PATCH /category/:id`, `DELETE /category/:id`

## Rule
- soft delete = `isActive=false`
- `sortOrder` ใช้เรียงหน้า POS
